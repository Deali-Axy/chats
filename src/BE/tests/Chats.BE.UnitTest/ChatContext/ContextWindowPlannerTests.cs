using Chats.BE.Services.ChatContext;
using Chats.BE.Services.Models;
using Chats.BE.Services.Models.ChatServices;
using Chats.BE.Services.Models.ChatServices.OpenAI;
using Chats.BE.Services.Models.Neutral;
using Chats.BE.Controllers.Users.Usages.Dtos;
using Chats.DB;

namespace Chats.BE.UnitTest.ChatContext;

public sealed class ContextWindowPlannerTests
{
    internal static ChatRequest Request(IList<NeutralMessage>? messages = null, int window = 4096) => new()
    {
        Messages = messages ?? [],
        ChatConfig = new ChatConfig { Model = new Model { CurrentSnapshot = new ModelSnapshot { ContextWindow = window } } },
        Source = UsageSource.WebChat,
    };

    internal static ContextTurn[] History(int count = 12) => Enumerable.Range(1, count)
        .Select(i => new ContextTurn(i, i % 2 == 1,
            [i % 2 == 1 ? NeutralMessage.FromUserText(string.Concat(Enumerable.Repeat($"user constraint {i}, ", 70)))
                : NeutralMessage.FromAssistantText(string.Concat(Enumerable.Repeat($"completed work {i}, ", 70)))]))
        .ToArray();

    [Fact]
    public void Boundary_DoesNotSplitUserAssistantExchange()
    {
        Assert.Equal(6, ContextWindowPlanner.FindBoundary(History(10), 3));
        Assert.Equal(0, ContextWindowPlanner.FindBoundary(History(2), 2));
    }

    [Fact]
    public void Boundary_KeepsPendingToolCallsWithResultsAcrossTurns()
    {
        var history = History(8);
        history[1] = history[1] with { Messages = [NeutralMessage.FromAssistant(NeutralToolCallContent.Create("call", "search", "{}"))] };
        history[3] = history[3] with { Messages = [NeutralMessage.FromTool(NeutralToolCallResponseContent.Create("call", "result")), NeutralMessage.FromAssistantText("done")] };
        Assert.Equal(0, ContextWindowPlanner.FindBoundary(history, 5));
        Assert.Equal(4, ContextWindowPlanner.FindBoundary(history, 4));
    }

    [Fact]
    public void Boundary_ProtectsUnansweredParallelToolCalls()
    {
        var history = History(8);
        history[1] = history[1] with { Messages = [NeutralMessage.FromAssistant(
            NeutralToolCallContent.Create("a", "search", "{}"), NeutralToolCallContent.Create("b", "search", "{}")),
            NeutralMessage.FromTool(NeutralToolCallResponseContent.Create("a", "done"))] };
        Assert.Equal(0, ContextWindowPlanner.FindBoundary(history, 2));
    }

    [Fact]
    public void Budget_ReservesOutputAndSafetyMargin()
    {
        ChatRequest request = Request(window: 32000);
        request.ChatConfig.MaxOutputTokens = 8000;
        var budget = ContextWindowPlanner.GetBudget(request);
        Assert.Equal(22400, budget.Budget);
        Assert.Equal(17920, budget.Threshold);
    }

    [Fact]
    public void Estimate_IncludesToolSchema()
    {
        ChatRequest request = Request();
        int before = request.EstimatePromptTokens(ChatService.Tokenizer);
        request.Tools.Add(FunctionTool.Create("search", "Search the web", "{\"type\":\"object\",\"properties\":{\"query\":{\"type\":\"string\"}}}"));
        Assert.True(request.EstimatePromptTokens(ChatService.Tokenizer) > before + 16);
    }

    [Fact]
    public void SourceHash_DetectsEditsButIgnoresModelSpecificThinking()
    {
        var history = History(4);
        string hash = ContextWindowPlanner.SourceHash(history);
        history[1].Messages[0] = history[1].Messages[0] with { Contents = [.. history[1].Messages[0].Contents, NeutralThinkContent.Create("private reasoning", "signature")] };
        Assert.Equal(hash, ContextWindowPlanner.SourceHash(history));
        history[0].Messages[0].Contents[0] = NeutralTextContent.Create("changed user requirement");
        Assert.NotEqual(hash, ContextWindowPlanner.SourceHash(history));
    }

    [Fact]
    public void Checkpoint_IsNotReusedForAnotherBranchOrEditedHistory()
    {
        var history = History(8);
        ChatSpan span = new() { ContextBoundaryTurnId = 4, ContextSummary = "summary", ContextSourceHash = ContextWindowPlanner.SourceHash(history.Take(4)) };
        ChatContextSession same = new(span, history, Request(history.SelectMany(t => t.Messages).ToList()));
        same.RestoreCheckpoint();
        Assert.Equal(4, same.CoveredTurns);
        Assert.Equal(5, same.Request.Messages.Count);

        var otherBranch = history.Select(t => t with { Id = t.Id + 100 }).ToArray();
        ChatContextSession other = new(span, otherBranch, Request(otherBranch.SelectMany(t => t.Messages).ToList()));
        other.RestoreCheckpoint();
        Assert.False(other.HasSummary);

        history[0].Messages[0].Contents[0] = NeutralTextContent.Create("edited");
        ChatContextSession edited = new(span, history, Request(history.SelectMany(t => t.Messages).ToList()));
        edited.RestoreCheckpoint();
        Assert.False(edited.HasSummary);
    }

    [Fact]
    public void ReplacePrefix_PreservesRecentAndInFlightToolChain()
    {
        var history = History(10);
        var call = NeutralMessage.FromAssistant(NeutralToolCallContent.Create("current", "run_code", "{}"), NeutralThinkContent.Create("thinking", "signature"));
        var result = NeutralMessage.FromTool(NeutralToolCallResponseContent.Create("current", "output"));
        ChatRequest request = Request([.. history.SelectMany(t => t.Messages), NeutralMessage.FromUserText("new question"), call, result]);
        ChatContextSession session = new(new ChatSpan(), history, request);
        session.ReplacePrefix(6, "summary");
        Assert.Equal(8, request.Messages.Count);
        Assert.Same(history[6].Messages[0], request.Messages[1]);
        Assert.Same(call, request.Messages[^2]);
        Assert.Same(result, request.Messages[^1]);
    }

    [Fact]
    public void Transcript_KeepsNonAsciiTextReadableAndJsonDelimited()
    {
        string text = "用户约束：保留路径 \"/tmp/目标\"";
        string transcript = ContextWindowPlanner.Transcript([new ContextTurn(1, true, [NeutralMessage.FromUserText(text)])]);
        Assert.Contains("用户约束", transcript);
        using var document = System.Text.Json.JsonDocument.Parse(transcript);
        Assert.Equal(text, document.RootElement[0].GetProperty("Messages")[0].GetProperty("Contents")[0].GetProperty("Content").GetString());
    }

    [Fact]
    public void SummaryChunks_StayWithinBudgetAndKeepUnicodePairs()
    {
        string text = string.Concat(Enumerable.Repeat("约束路径😀 and tool output\n", 2000));
        int offset = 0;
        while (offset < text.Length)
        {
            int length = ContextSummarizer.FindChunkLength(text.AsSpan(offset), 256);
            Assert.InRange(length, 1, text.Length - offset);
            Assert.True(ChatService.Tokenizer.CountTokens(text.Substring(offset, length)) <= 256);
            Assert.False(char.IsHighSurrogate(text[offset + length - 1]));
            offset += length;
        }
    }
}
