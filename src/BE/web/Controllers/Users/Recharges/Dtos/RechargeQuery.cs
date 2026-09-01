using Chats.BE.Controllers.Common.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Chats.BE.Controllers.Users.Recharges.Dtos;

public record RechargeQuery : PagingRequest, IRechargeQuery
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
}
