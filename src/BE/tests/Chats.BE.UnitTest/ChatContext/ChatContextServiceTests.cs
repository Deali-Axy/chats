using Chats.BE.Controllers.Chats.Chats;
using Chats.BE.Services.ChatContext;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.Neutral;
using Chats.DB;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace Chats.BE.UnitTest.ChatContext;

public sealed class ChatContextServiceTests : IDisposable
{
    private readonly string path = Path.Combine(Path.GetTempPath(), $"chats-context-{Guid.NewGuid():N}.db");
    private readonly ServiceProvider provider;
    private readonly StubSummarizer summarizer = new();
    private readonly ChatContextService service;

    public ChatContextServiceTests()
    {
        ServiceCollection services = new();
        services.AddDbContext<ChatsDB>(o => o.UseSqlite($"Data Source={path};Foreign Keys=False;Pooling=False"));
        provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ChatsDB>();
        db.Database.EnsureCreated();
        db.ChatSpans.Add(new ChatSpan { ChatId = 1, SpanId = 1, ChatConfigId = 1, Enabled = true });
        db.SaveChanges();
        service = new(provider.GetRequiredService<IServiceScopeFactory>(), summarizer, NullLogger<ChatContextService>.Instance);
    }

    private async Task<ChatContextSession> Session(ContextTurn[]? history = null, int window = 4096)
    {
        history ??= ContextWindowPlannerTests.History();
        ChatRequest request = ContextWindowPlannerTests.Request(history.SelectMany(t => t.Messages).ToList(), window);
        return await service.CreateSessionAsync(new ChatSpan { ChatId = 1, SpanId = 1 }, history, request, default);
    }

    private static UserModel User(ChatContextSession session) => new() { Model = session.Request.GetRequiredModel() };

    [Fact]
    public async Task AutomaticCompaction_PersistsAndReusesCheckpoint()
    {
        var session = await Session();
        List<string> stages = [];
        await service.PrepareAsync(session, User(session), false, (stage, _, _) => stages.Add(stage), default);
        Assert.Equal(["ready", "started", "completed"], stages);
        Assert.Equal(6, session.CoveredTurns);
        Assert.True(ChatContextService.GetStatus(session).EstimatedTokens < ChatContextService.GetStatus(session).InputBudget);
        var restored = await Session();
        Assert.Equal(6, restored.CoveredTurns);
        Assert.Equal("Preserved decisions and outstanding tasks.", restored.State.ContextSummary);
        Assert.Equal(1, summarizer.Calls);
    }

    [Fact]
    public async Task BelowThreshold_DoesNotCallSummaryModel()
    {
        var session = await Session(ContextWindowPlannerTests.History(4), window: 128000);
        await service.PrepareAsync(session, User(session), false, null, default);
        Assert.Equal(0, summarizer.Calls);
        Assert.False(session.HasSummary);
    }

    [Fact]
    public async Task ManualCompaction_WorksBelowThreshold()
    {
        var session = await Session(window: 128000);
        await service.PrepareAsync(session, User(session), true, null, default);
        Assert.Equal(6, session.CoveredTurns);
    }

    [Fact]
    public async Task FailedSummary_PreservesOriginalContextAndReportsFailure()
    {
        summarizer.Error = new InvalidOperationException("provider failed");
        var session = await Session(window: 128000);
        var original = session.Request.Messages.ToArray();
        List<string> stages = [];
        await Assert.ThrowsAsync<CustomChatServiceException>(() => service.PrepareAsync(session, User(session), true, (stage, _, _) => stages.Add(stage), default));
        Assert.Equal(original, session.Request.Messages);
        Assert.Equal(["ready", "started", "failed"], stages);
        Assert.Null((await Session()).State.ContextSummary);
    }

    [Fact]
    public async Task FailedSummary_SanitizesGatewayHtmlForTheUser()
    {
        summarizer.Error = new InvalidOperationException("<html><head><title>504 Gateway Time-out</title></head></html>");
        var session = await Session(window: 128000);
        string? reported = null;
        CustomChatServiceException ex = await Assert.ThrowsAsync<CustomChatServiceException>(() =>
            service.PrepareAsync(session, User(session), true, (_, _, error) => reported = error, default));
        Assert.Equal(ChatContextError.TimeoutMessage, reported);
        Assert.Contains(ChatContextError.TimeoutMessage, ex.Message);
    }

    [Fact]
    public async Task AutomaticFailure_BelowBudgetContinuesWithOriginalAndNotice()
    {
        summarizer.Error = new InvalidOperationException("provider failed");
        var session = await Session(ContextWindowPlannerTests.History(12), window: 6400);
        var status = ChatContextService.GetStatus(session);
        Assert.InRange(status.EstimatedTokens, status.AutoCompactThreshold, status.InputBudget);
        var original = session.Request.Messages.ToArray();
        List<string> stages = [];
        await service.PrepareAsync(session, User(session), false, (stage, _, _) => stages.Add(stage), default);
        Assert.Equal(original, session.Request.Messages);
        Assert.Contains("failed", stages);
        Assert.Null((await Session()).State.ContextSummary);
    }

    [Fact]
    public async Task RecentMessagesStillOversize_DoesNotPersistSummary()
    {
        var session = await Session(window: 1024);
        await Assert.ThrowsAsync<CustomChatServiceException>(() => service.PrepareAsync(session, User(session), true, null, default));
        Assert.False(session.HasSummary);
        Assert.Null((await Session()).State.ContextSummary);
    }

    [Fact]
    public async Task CancelledSummary_DoesNotPersistOrReplaceOriginal()
    {
        summarizer.Error = new OperationCanceledException();
        var session = await Session(window: 128000);
        var original = session.Request.Messages.ToArray();
        await Assert.ThrowsAsync<OperationCanceledException>(() => service.PrepareAsync(session, User(session), true, null, default));
        Assert.Equal(original, session.Request.Messages);
        Assert.Null((await Session()).State.ContextSummary);
    }

    [Fact]
    public async Task DisabledAutomaticCompaction_RejectsOversizeInputWithoutCallingModel()
    {
        var session = await Session(window: 1024);
        session.State.AutoCompactEnabled = false;
        await Assert.ThrowsAsync<CustomChatServiceException>(() => service.PrepareAsync(session, User(session), false, null, default));
        Assert.Equal(0, summarizer.Calls);
    }

    [Fact]
    public async Task ConcurrentSettingsChange_DoesNotOverwriteNewerContext()
    {
        var session = await Session(window: 128000);
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ChatsDB>();
        await db.ChatSpans.ExecuteUpdateAsync(setters => setters.SetProperty(s => s.ContextRevision, 1));
        await Assert.ThrowsAsync<CustomChatServiceException>(() => service.PrepareAsync(session, User(session), true, null, default));
        Assert.False(session.HasSummary);
        Assert.Null((await Session()).State.ContextSummary);
    }

    [Fact]
    public async Task AdditionalCompaction_MergesPreviousSummaryAndPreservesNewSuffix()
    {
        var history = ContextWindowPlannerTests.History();
        var first = await Session(history, 128000);
        await service.PrepareAsync(first, User(first), true, null, default);
        var more = ContextWindowPlannerTests.History(16);
        var second = await Session(more, 128000);
        Assert.Equal(6, second.CoveredTurns);
        await service.PrepareAsync(second, User(second), true, null, default);
        Assert.Equal("Preserved decisions and outstanding tasks.", summarizer.PreviousSummary);
        Assert.Equal(10, second.CoveredTurns);
        Assert.Same(more[10].Messages[0], second.Request.Messages[1]);
    }

    public void Dispose()
    {
        provider.Dispose();
        System.IO.File.Delete(path);
    }

    private sealed class StubSummarizer : IContextSummarizer
    {
        public int Calls { get; private set; }
        public Exception? Error { get; set; }
        public string? PreviousSummary { get; private set; }
        public Task<string> SummarizeAsync(UserModel userModel, string transcript, string? previousSummary, int maxOutputTokens, CancellationToken cancellationToken, Func<string, bool, CancellationToken, Task>? onDelta = null)
        {
            Calls++;
            PreviousSummary = previousSummary;
            if (Error != null) throw Error;
            return Task.FromResult("Preserved decisions and outstanding tasks.");
        }
    }
}
