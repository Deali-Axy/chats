using Chats.BE.Controllers.Users.Recharges.Dtos;
using Chats.DB.Enums;

namespace Chats.BE.UnitTest.Controllers.Users;

public class RechargeRecordDtoTests
{
    [Theory]
    [InlineData((byte)DBTransactionType.AdminCharge, "AdminCharge")]
    [InlineData((byte)DBTransactionType.Initial, "Initial")]
    public void TransactionType_UsesEnumName(byte typeId, string expected)
    {
        RechargeRecordDto dto = new()
        {
            Id = 1,
            UserName = "user",
            CreditUserName = "admin",
            TransactionTypeId = typeId,
            Amount = 10,
            CreatedAt = DateTime.UtcNow,
        };

        Assert.Equal(expected, dto.TransactionType);
    }

    [Fact]
    public void ToExcelFileName_IncludesFilters()
    {
        RechargeQueryNoPagination query = new()
        {
            User = "alice",
            CreditUser = "bob",
            Type = (byte)DBTransactionType.AdminCharge,
            Start = new DateOnly(2026, 1, 2),
            End = new DateOnly(2026, 1, 3),
            TimezoneOffset = -480,
        };

        Assert.Equal("recharge_alice_bob_1_2026-01-02_2026-01-03.xlsx", query.ToExcelFileName());
    }
}
