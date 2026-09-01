using Microsoft.AspNetCore.Mvc;

namespace Chats.BE.Controllers.Users.Recharges.Dtos;

public class RechargeQueryNoPagination : IRechargeQuery
{
    [FromQuery(Name = "user")]
    public string? User { get; init; }

    [FromQuery(Name = "credit-user")]
    public string? CreditUser { get; init; }

    [FromQuery(Name = "type")]
    public byte? Type { get; init; }

    [FromQuery(Name = "start")]
    public DateOnly? Start { get; init; }

    [FromQuery(Name = "end")]
    public DateOnly? End { get; init; }

    [FromQuery(Name = "tz")]
    public required short TimezoneOffset { get; init; }

    public string ToExcelFileName()
    {
        string fileName = "recharge";
        if (!string.IsNullOrEmpty(User))
        {
            fileName += $"_{User}";
        }
        if (!string.IsNullOrEmpty(CreditUser))
        {
            fileName += $"_{CreditUser}";
        }
        if (Type.HasValue)
        {
            fileName += $"_{Type}";
        }
        if (Start.HasValue)
        {
            fileName += $"_{Start:yyyy-MM-dd}";
        }
        if (End.HasValue)
        {
            fileName += $"_{End:yyyy-MM-dd}";
        }
        return $"{fileName}.xlsx";
    }
}
