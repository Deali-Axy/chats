namespace Chats.DB;

public partial class ChatSpan
{
    public bool AutoCompactEnabled { get; set; } = true;
    public int ContextKeepRecentTurns { get; set; } = 6;
    public string? ContextSummary { get; set; }
    public long? ContextBoundaryTurnId { get; set; }
    public string? ContextSourceHash { get; set; }
    public int ContextCompactedTurns { get; set; }
    public DateTime? ContextCompactedAt { get; set; }
    public int? ContextBeforeTokens { get; set; }
    public int? ContextAfterTokens { get; set; }
    public int ContextRevision { get; set; }
}
