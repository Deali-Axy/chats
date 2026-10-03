using Chats.BE.Services.Models;
using Chats.BE.Services.Models.Neutral;
using Chats.DB;

namespace Chats.BE.Services.ChatContext;

public sealed class ChatContextSession(ChatSpan state, IReadOnlyList<ContextTurn> history, ChatRequest request)
{
    public ChatSpan State { get; } = state;
    public IReadOnlyList<ContextTurn> History { get; } = history;
    public ChatRequest Request { get; } = request;
    public int CoveredTurns { get; private set; }
    public bool HasSummary => CoveredTurns > 0 && !string.IsNullOrWhiteSpace(State.ContextSummary);

    public void RestoreCheckpoint()
    {
        int boundary = History.ToList().FindIndex(t => t.Id == State.ContextBoundaryTurnId) + 1;
        if (boundary > 0 && !string.IsNullOrWhiteSpace(State.ContextSummary)
            && ContextWindowPlanner.SourceHash(History.Take(boundary)) == State.ContextSourceHash)
        {
            ReplacePrefix(boundary, State.ContextSummary);
        }
    }

    public IList<NeutralMessage> Preview(int boundary, string summary)
    {
        int removeCount = History.Skip(CoveredTurns).Take(boundary - CoveredTurns).Sum(t => t.Messages.Count)
            + (HasSummary ? 1 : 0);
        return [ContextWindowPlanner.SummaryMessage(summary), .. Request.Messages.Skip(removeCount)];
    }

    public void ReplacePrefix(int boundary, string summary)
    {
        IList<NeutralMessage> messages = Preview(boundary, summary);
        Request.Messages.Clear();
        foreach (NeutralMessage message in messages) Request.Messages.Add(message);
        CoveredTurns = boundary;
    }
}
