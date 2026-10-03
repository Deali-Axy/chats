using Chats.BE.Services.Models;
using Chats.BE.Services.Models.ChatServices;
using Chats.BE.Services.Models.Neutral;
using Chats.DB;
using Chats.DB.Enums;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.Services.ChatContext;

public sealed record ContextHandoffPreview(string? Summary, string SourceHash, bool IncludesRecentMessages);

public sealed class ChatContextHandoffService(ChatsDB db, IContextSummarizer summarizer)
{
    public async Task<ContextHandoffPreview> PreviewAsync(ChatContextSession session, UserModel userModel,
        bool generateSummary, CancellationToken cancellationToken)
    {
        if (!ChatContextService.IsSupported(session.Request))
            throw new InvalidOperationException("Context handoff is unavailable for image generation models.");
        if (session.History.Count == 0)
            throw new InvalidOperationException("There is no conversation to summarize yet.");

        string? summary = session.HasSummary ? session.State.ContextSummary : null;
        if (generateSummary)
        {
            HashSet<string> pending = new(StringComparer.Ordinal);
            foreach (NeutralContent content in session.History.SelectMany(t => t.Messages).SelectMany(m => m.Contents))
            {
                if (content is NeutralToolCallContent call) pending.Add(call.Id);
                if (content is NeutralToolCallResponseContent result) pending.Remove(result.ToolCallId);
            }
            if (pending.Count > 0)
                throw new InvalidOperationException("Finish the pending tool calls before generating a handoff summary.");

            int limit = Math.Max(64, Math.Min(2048, ContextWindowPlanner.GetBudget(session.Request).Budget / 8));
            if (userModel.Model.CurrentSnapshot.MaxResponseTokens is int maximum) limit = Math.Min(limit, maximum);
            summary = await summarizer.SummarizeAsync(userModel,
                ContextWindowPlanner.Transcript(session.History.Skip(session.CoveredTurns)), summary, limit, cancellationToken);
            if (string.IsNullOrWhiteSpace(summary)) throw new InvalidOperationException("The model returned an empty handoff summary.");
        }
        return new(summary, ContextWindowPlanner.SourceHash(session.History), generateSummary || session.CoveredTurns == session.History.Count);
    }

    public async Task<Chat> CreateAsync(ChatContextSession session, UserModel userModel, string sourceHash,
        string summary, string title, string sourceUrl, string language, CancellationToken cancellationToken)
    {
        if (!ChatContextService.IsSupported(session.Request))
            throw new InvalidOperationException("Context handoff is unavailable for image generation models.");
        if (session.History.Count == 0 || sourceHash != ContextWindowPlanner.SourceHash(session.History))
            throw new InvalidOperationException("The source conversation changed. Refresh the handoff summary before creating a new conversation.");
        summary = summary.Trim();
        title = title.Trim();
        if (summary.Length == 0 || title.Length == 0)
            throw new InvalidOperationException("A title and a non-empty context summary are required.");

        // The summary is a visible user message, not a system instruction or a hidden checkpoint.
        bool chinese = language == "zh-CN";
        string seed = chinese ? "# 对话交接摘要\n\n" +
            $"[来源对话]({sourceUrl})\n\n" +
            "以下内容来自先前对话，作为继续工作的背景摘要，可能存在遗漏。请遵循当前指令和用户接下来的请求。" +
            "引用的附件、文件及运行中的工具会话仍留在来源对话，没有迁移到当前对话。\n\n" + summary
            : "# Conversation handoff\n\n" +
            $"[Source conversation]({sourceUrl})\n\n" +
            "The following summary is background from the previous conversation. It may be incomplete; " +
            "follow current instructions and the user's next request. Referenced attachments, files and running tool sessions " +
            "remain in the source conversation and have not been transferred.\n\n" + summary;
        string acknowledgementText = chinese ? "交接摘要已载入，请发送下一条消息继续工作。" : "Context summary loaded. Send your next request to continue.";
        var request = session.Request with { Messages = [NeutralMessage.FromUserText(seed), NeutralMessage.FromAssistantText(acknowledgementText)] };
        if (request.EstimatePromptTokens(ChatService.Tokenizer) > ContextWindowPlanner.GetBudget(request).Budget)
            throw new InvalidOperationException("The handoff summary is too large for this model. Shorten it before creating the new conversation.");

        Chat source = await db.Chats.AsNoTracking().SingleAsync(c => c.Id == session.State.ChatId && c.UserId == userModel.UserId, cancellationToken);
        ChatConfig config = session.Request.ChatConfig.Clone();
        config.Id = 0;
        // Preserve foreign keys without inserting detached model/server entities again.
        foreach (ChatConfigMcp mcp in config.ChatConfigMcps) mcp.McpServer = null!;
        ChatSpan span = new()
        {
            SpanId = 0, Enabled = true, ChatConfig = config,
            AutoCompactEnabled = session.State.AutoCompactEnabled,
            ContextKeepRecentTurns = session.State.ContextKeepRecentTurns,
        };
        Chat chat = new()
        {
            UserId = source.UserId, ChatGroupId = source.ChatGroupId, Title = title,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            IsTemp = false, ChatSpans = [span],
        };

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        db.Chats.Add(chat);
        await db.SaveChangesAsync(cancellationToken);
        ChatTurn turn = new()
        {
            ChatId = chat.Id, IsUser = true,
            Steps = [new Step { ChatRoleId = (byte)DBChatRole.User, CreatedAt = DateTime.UtcNow, StepContents = [StepContent.FromText(seed)] }],
        };
        db.ChatTurns.Add(turn);
        await db.SaveChangesAsync(cancellationToken);
        // Chat continuation expects an assistant leaf. This explicit loading acknowledgement
        // is a local notice, not an additional model call or a fabricated model response.
        ChatTurn acknowledgement = new()
        {
            ChatId = chat.Id, ParentId = turn.Id, IsUser = false, SpanId = 0,
            Steps = [new Step { ChatRoleId = (byte)DBChatRole.Assistant, CreatedAt = DateTime.UtcNow,
                StepContents = [StepContent.FromText(acknowledgementText)] }],
        };
        db.ChatTurns.Add(acknowledgement);
        await db.SaveChangesAsync(cancellationToken);
        chat.LeafTurnId = acknowledgement.Id;
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        // FromDB needs the already-tracked model graph. Do not reattach MCP servers; their IDs are enough.
        config.Model = userModel.Model;
        return chat;
    }
}
