using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.ChatServices;
using Chats.BE.Services.Models.Neutral;
using Chats.DB;
using Chats.DB.Enums;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.Services.ChatContext;

public sealed class ChatContextService(IServiceScopeFactory scopeFactory, IContextSummarizer summarizer, ILogger<ChatContextService> logger)
{
    public static bool IsSupported(ChatRequest request) =>
        (DBApiType)request.GetRequiredModel().CurrentSnapshot.ApiTypeId != DBApiType.OpenAIImageGeneration;

    public async Task<ChatContextSession> CreateSessionAsync(ChatSpan span, IReadOnlyList<ContextTurn> history, ChatRequest request, CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        ChatsDB db = scope.ServiceProvider.GetRequiredService<ChatsDB>();
        ChatSpan state = await db.ChatSpans.AsNoTracking().SingleAsync(x => x.ChatId == span.ChatId && x.SpanId == span.SpanId, cancellationToken);
        ChatContextSession session = new(state, history, request);
        if (IsSupported(request)) session.RestoreCheckpoint();
        return session;
    }

    public static ChatContextStatus GetStatus(ChatContextSession session)
    {
        ChatRequest request = session.Request;
        var budget = ContextWindowPlanner.GetBudget(request);
        int total = request.EstimatePromptTokens(ChatService.Tokenizer);
        int system = (request with { Messages = [], Tools = [] }).EstimatePromptTokens(ChatService.Tokenizer) - 3;
        int tools = (request with { Messages = [] }).EstimatePromptTokens(ChatService.Tokenizer) - system - 3;
        int summary = session.HasSummary
            ? (request with { Messages = [ContextWindowPlanner.SummaryMessage(session.State.ContextSummary!)], Tools = [], System = NeutralSystemMessage.FromText(""), ChatConfig = request.ChatConfig.WithSystemPrompt("") })
                .EstimatePromptTokens(ChatService.Tokenizer) - 7
            : 0;
        return new ChatContextStatus
        {
            EstimatedTokens = total,
            ContextWindow = budget.Window,
            ReservedOutputTokens = budget.Reserved,
            InputBudget = budget.Budget,
            AutoCompactThreshold = budget.Threshold,
            SystemTokens = system,
            ToolsTokens = tools,
            SummaryTokens = summary,
            HistoryTokens = Math.Max(0, total - system - tools - summary - 3),
            RetainedTurns = session.History.Count - session.CoveredTurns,
            CompactedTurns = session.CoveredTurns,
            AutoCompactEnabled = session.State.AutoCompactEnabled,
            KeepRecentTurns = session.State.ContextKeepRecentTurns,
            CanCompact = IsSupported(request) && ContextWindowPlanner.FindBoundary(session.History, session.State.ContextKeepRecentTurns) > session.CoveredTurns,
            Supported = IsSupported(request),
            Summary = session.HasSummary ? session.State.ContextSummary : null,
            CompactedAt = session.HasSummary ? session.State.ContextCompactedAt : null,
            BeforeTokens = session.HasSummary ? session.State.ContextBeforeTokens : null,
            AfterTokens = session.HasSummary ? session.State.ContextAfterTokens : null,
        };
    }

    public async Task PrepareAsync(ChatContextSession session, UserModel userModel, bool force,
        Action<string, ChatContextStatus, string?>? notify, CancellationToken cancellationToken)
    {
        ChatContextStatus before = GetStatus(session);
        notify?.Invoke("ready", before, null);
        if (!before.Supported)
        {
            if (force) throw new InvalidOperationException("Context compaction is unavailable for image generation models.");
            return;
        }
        if (force || before.AutoCompactEnabled && before.EstimatedTokens >= before.AutoCompactThreshold && before.CanCompact)
        {
            int boundary = ContextWindowPlanner.FindBoundary(session.History, before.KeepRecentTurns);
            if (boundary <= session.CoveredTurns) throw new InvalidOperationException("There are no older complete turns to compact. Reduce the number of recent turns to keep.");
            notify?.Invoke("started", before, null);
            try
            {
                int outputLimit = Math.Max(64, Math.Min(2048, before.InputBudget / 8));
                if (userModel.Model.CurrentSnapshot.MaxResponseTokens is int maxResponse) outputLimit = Math.Min(outputLimit, maxResponse);
                string transcript = ContextWindowPlanner.Transcript(session.History.Skip(session.CoveredTurns).Take(boundary - session.CoveredTurns));
                string summary = await summarizer.SummarizeAsync(userModel, transcript, session.HasSummary ? session.State.ContextSummary : null, outputLimit, cancellationToken);
                int afterTokens = (session.Request with { Messages = session.Preview(boundary, summary) }).EstimatePromptTokens(ChatService.Tokenizer);
                if (afterTokens >= before.EstimatedTokens)
                    throw new InvalidOperationException("The summary did not reduce context usage. The original context has been preserved.");
                if (afterTokens > before.InputBudget)
                    throw new InvalidOperationException("Recent messages and tools still exceed the input budget. Keep fewer recent turns, shorten the current message/tool output, or select a model with a larger context window. The original context has been preserved.");

                await PersistAsync(session, boundary, summary, before.EstimatedTokens, afterTokens, cancellationToken);
                session.ReplacePrefix(boundary, summary);
                session.State.ContextSummary = summary;
                session.State.ContextCompactedAt = DateTime.UtcNow;
                session.State.ContextBeforeTokens = before.EstimatedTokens;
                session.State.ContextAfterTokens = afterTokens;
                notify?.Invoke("completed", GetStatus(session), null);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Context compaction failed for chat {ChatId}, span {SpanId}", session.State.ChatId, session.State.SpanId);
                string message = ChatContextError.ToUserMessage(ex);
                notify?.Invoke("failed", GetStatus(session), message);
                if (force || before.EstimatedTokens > before.InputBudget)
                    throw new CustomChatServiceException(DBFinishReason.BadParameter,
                        message == ChatContextError.TimeoutMessage ? message : "Context compaction failed: " + message);
            }
        }
        ChatContextStatus current = GetStatus(session);
        if (current.EstimatedTokens > current.InputBudget)
            throw new CustomChatServiceException(DBFinishReason.BadParameter,
                "The current context exceeds the input budget. Compact older turns, keep fewer recent turns, shorten the current message/tool output, or select a model with a larger context window.");
    }

    private async Task PersistAsync(ChatContextSession session, int boundary, string summary, int before, int after, CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
        ChatsDB db = scope.ServiceProvider.GetRequiredService<ChatsDB>();
        ChatSpan state = session.State;
        string hash = ContextWindowPlanner.SourceHash(session.History.Take(boundary));
        int updated = await db.ChatSpans
            .Where(x => x.ChatId == state.ChatId && x.SpanId == state.SpanId && x.ContextRevision == state.ContextRevision)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.ContextSummary, summary)
                .SetProperty(x => x.ContextBoundaryTurnId, session.History[boundary - 1].Id)
                .SetProperty(x => x.ContextSourceHash, hash)
                .SetProperty(x => x.ContextCompactedTurns, boundary)
                .SetProperty(x => x.ContextCompactedAt, DateTime.UtcNow)
                .SetProperty(x => x.ContextBeforeTokens, before)
                .SetProperty(x => x.ContextAfterTokens, after)
                .SetProperty(x => x.ContextRevision, x => x.ContextRevision + 1), cancellationToken);
        if (updated != 1) throw new InvalidOperationException("Context settings changed during compaction. Refresh and try again.");
        state.ContextRevision++;
        state.ContextBoundaryTurnId = session.History[boundary - 1].Id;
        state.ContextSourceHash = hash;
        state.ContextCompactedTurns = boundary;
    }
}
