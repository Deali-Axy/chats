using Chats.DB.Enums;

namespace Chats.BE.Controllers.Users.Recharges.Dtos;

public record RechargeRecordDto
{
    public required long Id { get; init; }

    public required string UserName { get; init; }

    public required string CreditUserName { get; init; }

    public required byte TransactionTypeId { get; init; }

    public string TransactionType => ((DBTransactionType)TransactionTypeId).ToString();

    public required decimal Amount { get; init; }

    public required DateTime CreatedAt { get; init; }
}
