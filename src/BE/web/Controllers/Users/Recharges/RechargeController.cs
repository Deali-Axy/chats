using Chats.BE.Controllers.Common.Dtos;
using Chats.BE.Controllers.Users.Recharges.Dtos;
using Chats.BE.Infrastructure;
using Chats.DB;
using Chats.DB.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniExcelLibs;

namespace Chats.BE.Controllers.Users.Recharges;

[Route("api/recharge"), Authorize]
public class RechargeController(ChatsDB db, CurrentUser currentUser) : ControllerBase
{
    private static readonly byte[] RechargeTypeIds =
    [
        (byte)DBTransactionType.AdminCharge,
        (byte)DBTransactionType.Initial,
    ];

    [HttpGet]
    public async Task<ActionResult<PagedResult<RechargeRecordDto>>> GetRecharges(RechargeQuery query, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsValidType(query.Type))
        {
            return BadRequest("Invalid recharge type");
        }

        IQueryable<RechargeRecordDto> rows = ProcessQuery(query);
        return Ok(await PagedResult.FromQuery(rows, query, cancellationToken));
    }

    [HttpGet("excel")]
    public async Task<IActionResult> ExportExcel(RechargeQueryNoPagination query, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsValidType(query.Type))
        {
            return BadRequest("Invalid recharge type");
        }

        List<RechargeRecordDto> rows = await ProcessQuery(query).ToListAsync(cancellationToken);
        MemoryStream stream = new();
        MiniExcel.SaveAs(stream, rows.Select(x => new
        {
            x.UserName,
            Operator = x.CreditUserName,
            Type = x.TransactionType,
            x.Amount,
            x.CreatedAt,
        }));
        stream.Position = 0;
        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", query.ToExcelFileName());
    }

    [HttpGet("stat")]
    public async Task<ActionResult<RechargeStatistics>> GetStatistics(RechargeQueryNoPagination query, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (!IsValidType(query.Type))
        {
            return BadRequest("Invalid recharge type");
        }

        IQueryable<RechargeRecordDto> rows = ProcessQuery(query);
        return Ok(new RechargeStatistics
        {
            Count = await rows.CountAsync(cancellationToken),
            SumAmount = await rows.SumAsync(x => (decimal?)x.Amount, cancellationToken) ?? 0,
        });
    }

    private IQueryable<RechargeRecordDto> ProcessQuery(IRechargeQuery query)
    {
        IQueryable<BalanceTransaction> transactions = db.BalanceTransactions
            .Where(x => RechargeTypeIds.Contains(x.TransactionTypeId));

        if (currentUser.IsAdmin)
        {
            if (!string.IsNullOrEmpty(query.User))
            {
                transactions = transactions.Where(x => x.User.UserName.Contains(query.User));
            }

            if (!string.IsNullOrEmpty(query.CreditUser))
            {
                transactions = transactions.Where(x => x.CreditUser.UserName.Contains(query.CreditUser));
            }
        }
        else
        {
            transactions = transactions.Where(x => x.UserId == currentUser.Id);
        }

        if (query.Type != null)
        {
            byte typeId = query.Type.Value;
            transactions = transactions.Where(x => x.TransactionTypeId == typeId);
        }

        if (query.Start != null)
        {
            DateTime localStart = query.Start.Value
                .ToDateTime(new TimeOnly(), DateTimeKind.Utc)
                .AddMinutes(query.TimezoneOffset);
            transactions = transactions.Where(x => x.CreatedAt >= localStart);
        }

        if (query.End != null)
        {
            DateTime localEnd = query.End.Value
                .AddDays(1)
                .ToDateTime(new TimeOnly(), DateTimeKind.Utc)
                .AddMinutes(query.TimezoneOffset);
            transactions = transactions.Where(x => x.CreatedAt < localEnd);
        }

        return transactions
            .OrderByDescending(x => x.Id)
            .Select(x => new RechargeRecordDto
            {
                Id = x.Id,
                UserName = x.User.UserName,
                CreditUserName = x.CreditUser.UserName,
                TransactionTypeId = x.TransactionTypeId,
                Amount = x.Amount,
                CreatedAt = x.CreatedAt,
            });
    }

    private static bool IsValidType(byte? type)
    {
        return type is null || RechargeTypeIds.Contains(type.Value);
    }
}
