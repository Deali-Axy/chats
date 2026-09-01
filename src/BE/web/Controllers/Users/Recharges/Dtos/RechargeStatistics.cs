namespace Chats.BE.Controllers.Users.Recharges.Dtos;

public record RechargeStatistics
{
    public int Count { get; init; }

    public decimal SumAmount { get; init; }
}
