namespace Chats.BE.Controllers.Users.Recharges.Dtos;

public interface IRechargeQuery
{
    string? User { get; }

    string? CreditUser { get; }

    byte? Type { get; }

    DateOnly? Start { get; }

    DateOnly? End { get; }

    short TimezoneOffset { get; }
}
