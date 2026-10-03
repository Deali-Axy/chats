namespace Chats.BE.Services.ChatContext;

public sealed record ChatContextStatus
{
    public required int EstimatedTokens { get; init; }
    public required int ContextWindow { get; init; }
    public required int ReservedOutputTokens { get; init; }
    public required int InputBudget { get; init; }
    public required int AutoCompactThreshold { get; init; }
    public required int SystemTokens { get; init; }
    public required int ToolsTokens { get; init; }
    public required int HistoryTokens { get; init; }
    public required int SummaryTokens { get; init; }
    public int DraftTokens { get; init; }
    public required int RetainedTurns { get; init; }
    public required int CompactedTurns { get; init; }
    public required bool AutoCompactEnabled { get; init; }
    public required int KeepRecentTurns { get; init; }
    public required bool CanCompact { get; init; }
    public required bool Supported { get; init; }
    public bool IsEstimate => true;
    public string? Summary { get; init; }
    public DateTime? CompactedAt { get; init; }
    public int? BeforeTokens { get; init; }
    public int? AfterTokens { get; init; }
}
