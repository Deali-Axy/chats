using Chats.BE.Services.ChatContext;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.Neutral;
using Chats.DB;
using Chats.DB.Enums;
using Microsoft.EntityFrameworkCore;

namespace Chats.BE.UnitTest.ChatContext;

public sealed class ChatContextHandoffTests : IDisposable
{
    private readonly string path = Path.Combine(Path.GetTempPath(), $"chats-handoff-{Guid.NewGuid():N}.db");
    private readonly ChatsDB db;
    private readonly StubSummarizer summarizer = new();
    private readonly ChatContextHandoffService service;

    public ChatContextHandoffTests()
    {
        db = new ChatsDB(new DbContextOptionsBuilder<ChatsDB>().UseSqlite($"Data Source={path};Foreign Keys=False;Pooling=False").Options);
        db.Database.EnsureCreated();
        db.Chats.Add(new Chat { Id = 1, UserId = 7, Title = "Original work", ChatGroupId = 9, IsTemp = true });
        db.SaveChanges();
        service = new(db, summarizer);
    }

    private static ChatContextSession Session(bool checkpoint = true, int window = 4096)
    {
        var history = ContextWindowPlannerTests.History(8);
        ChatRequest request = ContextWindowPlannerTests.Request(history.SelectMany(t => t.Messages).ToList(), window);
        request.ChatConfig.ModelId = 1;
        request.ChatConfig.SystemPrompt = "Preserve user constraints";
        request.ChatConfig.Temperature = 0.2f;
        request.ChatConfig.Effort = "medium";
        request.ChatConfig.CodeExecutionEnabled = true;
        request.ChatConfig.ChatConfigMcps = [new ChatConfigMcp { McpServerId = 5, CustomHeaders = "{\"X-Project\":\"demo\"}", McpServer = new McpServer { Name = "search", DisplayName = "Search" } }];
        ChatSpan state = new() { ChatId = 1, SpanId = 0, AutoCompactEnabled = false, ContextKeepRecentTurns = 4 };
        if (checkpoint)
        {
            state.ContextSummary = "Older decisions";
            state.ContextBoundaryTurnId = 4;
            state.ContextSourceHash = ContextWindowPlanner.SourceHash(history.Take(4));
        }
        var session = new ChatContextSession(state, history, request);
        session.RestoreCheckpoint();
        return session;
    }

    private static UserModel User(ChatContextSession session) => new() { UserId = 7, ModelId = 1, Model = session.Request.GetRequiredModel() };

    [Fact]
    public async Task ExistingSummary_IsReusedWithoutModelCallAndWarnsAboutRecentHistory()
    {
        var session = Session();
        var preview = await service.PreviewAsync(session, User(session), false, default);
        Assert.Equal("Older decisions", preview.Summary);
        Assert.False(preview.IncludesRecentMessages);
        Assert.Equal(ContextWindowPlanner.SourceHash(session.History), preview.SourceHash);
        Assert.Equal(0, summarizer.Calls);
    }

    [Fact]
    public async Task FreshSummary_IncludesRecentHistoryAndDoesNotModifySourceCheckpoint()
    {
        var session = Session();
        var original = session.Request.Messages.ToArray();
        List<(string Text, bool Replace)> deltas = [];
        var preview = await service.PreviewAsync(session, User(session), true, default,
            (text, replace, _) => { deltas.Add((text, replace)); return Task.CompletedTask; });
        Assert.Equal("Fresh decisions and next actions", preview.Summary);
        Assert.True(preview.IncludesRecentMessages);
        Assert.Equal("Older decisions", summarizer.PreviousSummary);
        Assert.Contains("user constraint 7", summarizer.Transcript);
        Assert.DoesNotContain("user constraint 1", summarizer.Transcript);
        Assert.Equal("Older decisions", session.State.ContextSummary);
        Assert.Equal(0, session.State.ContextRevision);
        Assert.Equal(original, session.Request.Messages);
        Assert.Equal([("Fresh decisions", true), (" and next actions", false)], deltas);
    }

    [Fact]
    public async Task WithoutCheckpoint_FreshSummaryCoversEntireConversation()
    {
        var session = Session(false);
        Assert.Null((await service.PreviewAsync(session, User(session), false, default)).Summary);
        await service.PreviewAsync(session, User(session), true, default);
        Assert.Contains("user constraint 1", summarizer.Transcript);
        Assert.Contains("user constraint 7", summarizer.Transcript);
        Assert.Null(summarizer.PreviousSummary);
    }

    [Fact]
    public async Task Create_CopiesSettingsAndStoresVisibleContextWithAssistantLeaf()
    {
        var session = Session();
        var preview = await service.PreviewAsync(session, User(session), false, default);
        Chat chat = await service.CreateAsync(session, User(session), preview.SourceHash, "Edited context and next step", "Continue working", "/home#/source", "zh-CN", default);
        Assert.NotEqual(1, chat.Id);
        Assert.Equal(7, chat.UserId);
        Assert.Equal(9, chat.ChatGroupId);
        Assert.False(chat.IsTemp);
        Assert.False(chat.IsTopMost);
        var span = Assert.Single(chat.ChatSpans);
        Assert.Equal(0, span.SpanId);
        Assert.False(span.AutoCompactEnabled);
        Assert.Equal(4, span.ContextKeepRecentTurns);
        Assert.Null(span.ContextSummary);
        Assert.Equal((short)1, span.ChatConfig.ModelId);
        Assert.Equal(session.Request.ChatConfig.SystemPrompt, span.ChatConfig.SystemPrompt);
        Assert.Equal(0.2f, span.ChatConfig.Temperature);
        Assert.Equal("medium", span.ChatConfig.Effort);
        Assert.True(span.ChatConfig.CodeExecutionEnabled);
        Assert.NotEqual(session.Request.ChatConfig.Id, span.ChatConfig.Id);
        Assert.Equal(5, Assert.Single(span.ChatConfig.ChatConfigMcps).McpServerId);
        var turns = await db.ChatTurns.Where(t => t.ChatId == chat.Id).Include(t => t.Steps).ThenInclude(s => s.StepContents).ThenInclude(c => c.StepContentText).OrderBy(t => t.Id).ToArrayAsync();
        Assert.Equal(2, turns.Length);
        Assert.True(turns[0].IsUser);
        string seed = turns[0].Steps.Single().StepContents.Single().StepContentText!.Content;
        Assert.Contains("Edited context and next step", seed);
        Assert.Contains("/home#/source", seed);
        Assert.False(turns[1].IsUser);
        Assert.Equal(turns[0].Id, turns[1].ParentId);
        Assert.Equal(turns[1].Id, chat.LeafTurnId);
        Assert.All(turns.SelectMany(t => t.Steps), s => Assert.Null(s.UsageId));
        Assert.Equal(0, summarizer.Calls);
        Assert.True((await db.Chats.SingleAsync(c => c.Id == 1)).IsTemp);
    }

    [Fact]
    public async Task ChangedSource_IsRejectedBeforeCreatingAnything()
    {
        var session = Session();
        var preview = await service.PreviewAsync(session, User(session), false, default);
        session.History[0].Messages[0].Contents[0] = NeutralTextContent.Create("Edited requirement");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(session, User(session), preview.SourceHash, "summary", "title", "/home#/source", "en", default));
        Assert.Equal(1, await db.Chats.CountAsync());
        Assert.Equal(0, await db.ChatTurns.CountAsync());
    }

    [Fact]
    public async Task OversizedEditedSummary_IsRejectedBeforeCreatingAnything()
    {
        var session = Session();
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(session, User(session), ContextWindowPlanner.SourceHash(session.History),
            string.Concat(Enumerable.Repeat("large context ", 5000)), "title", "/home#/source", "en", default));
        Assert.Equal(1, await db.Chats.CountAsync());
    }

    [Fact]
    public async Task EmptyTitleOrSummary_IsRejectedBeforeCreatingAnything()
    {
        var session = Session();
        string hash = ContextWindowPlanner.SourceHash(session.History);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(session, User(session), hash, "   ", "title", "/home#/source", "en", default));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(session, User(session), hash, "summary", "  ", "/home#/source", "en", default));
        Assert.Equal(1, await db.Chats.CountAsync());
    }

    [Fact]
    public async Task ImageGenerationModel_CannotPreviewOrCreateHandoff()
    {
        var session = Session();
        session.Request.GetRequiredModel().CurrentSnapshot.ApiTypeId = (byte)DBApiType.OpenAIImageGeneration;
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.PreviewAsync(session, User(session), false, default));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(session, User(session),
            ContextWindowPlanner.SourceHash(session.History), "summary", "title", "/home#/source", "en", default));
        Assert.Equal(0, summarizer.Calls);
        Assert.Equal(1, await db.Chats.CountAsync());
    }

    [Fact]
    public async Task PendingToolCall_DoesNotGeneratePartialHandoff()
    {
        var session = Session(false);
        session.History[^1].Messages[0] = NeutralMessage.FromAssistant(NeutralToolCallContent.Create("pending", "search", "{}"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.PreviewAsync(session, User(session), true, default));
        Assert.Equal(0, summarizer.Calls);
    }

    public void Dispose() { db.Dispose(); System.IO.File.Delete(path); }

    private sealed class StubSummarizer : IContextSummarizer
    {
        public int Calls { get; private set; }
        public string? PreviousSummary { get; private set; }
        public string? Transcript { get; private set; }
        public async Task<string> SummarizeAsync(UserModel userModel, string transcript, string? previousSummary, int maxOutputTokens, CancellationToken cancellationToken, Func<string, bool, CancellationToken, Task>? onDelta = null)
        {
            Calls++;
            Transcript = transcript;
            PreviousSummary = previousSummary;
            if (onDelta != null)
            {
                await onDelta("Fresh decisions", true, cancellationToken);
                await onDelta(" and next actions", false, cancellationToken);
            }
            return "Fresh decisions and next actions";
        }
    }
}
