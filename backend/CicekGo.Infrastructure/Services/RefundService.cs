using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Refunds;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class RefundService : IRefundService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;

    public RefundService(TenantDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    private static RefundDto Map(Refund r) => new()
    {
        Id = r.Id,
        OrderId = r.OrderId,
        OrderCode = r.OrderCode,
        CustomerId = r.CustomerId,
        CustomerName = r.CustomerName,
        RecipientName = r.RecipientName,
        RecipientPhone = r.RecipientPhone,
        Amount = r.Amount,
        RefundedAmount = r.RefundedAmount,
        Remaining = Math.Max(0m, r.Amount - r.RefundedAmount),
        Status = r.Status,
        Reason = r.Reason,
        PlannedDate = r.PlannedDate,
        CreatedAt = r.CreatedAt,
        CreatedBy = r.CreatedBy,
        CompletedAt = r.CompletedAt,
        Note = r.Note
    };

    public async Task<IReadOnlyList<RefundDto>> ListAsync(int? customerId, bool onlyOpen, CancellationToken ct = default)
    {
        var q = _db.Refunds.AsNoTracking().AsQueryable();
        if (customerId.HasValue) q = q.Where(r => r.CustomerId == customerId.Value);
        if (onlyOpen) q = q.Where(r => r.Status == "PENDING" || r.Status == "PARTIAL");
        var list = await q.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<RefundDto>> SearchAsync(string? query, bool nonCariOnly, bool onlyOpen, CancellationToken ct = default)
    {
        var q = _db.Refunds.AsNoTracking().AsQueryable();
        if (nonCariOnly) q = q.Where(r => r.CustomerId == null);
        if (onlyOpen) q = q.Where(r => r.Status == "PENDING" || r.Status == "PARTIAL");
        var s = string.IsNullOrWhiteSpace(query) ? null : query.Trim();
        if (s is not null)
        {
            var like = $"%{s}%";
            q = q.Where(r => EF.Functions.ILike(r.OrderCode, like)
                || (r.RecipientPhone != null && EF.Functions.ILike(r.RecipientPhone, like))
                || (r.RecipientName != null && EF.Functions.ILike(r.RecipientName, like))
                || (r.CustomerName != null && EF.Functions.ILike(r.CustomerName, like)));
        }
        var list = await q.OrderByDescending(r => r.CreatedAt).Take(200).ToListAsync(ct);
        return list.Select(Map).ToList();
    }

    public async Task<RefundDto> ProcessAsync(int refundId, RefundProcessDto dto, CancellationToken ct = default)
    {
        var r = await _db.Refunds.FirstOrDefaultAsync(x => x.Id == refundId, ct)
            ?? throw new NotFoundException("refund not found");
        if (r.Status == "DONE") throw new AppException("Bu iade zaten tamamlandı.");
        if (r.Status == "CANCELLED") throw new AppException("Bu iade iptal edilmiş.");

        var remaining = Math.Max(0m, r.Amount - r.RefundedAmount);
        var amount = dto.Amount.HasValue && dto.Amount.Value > 0 ? dto.Amount.Value : remaining;
        if (amount <= 0) throw new AppException("Geçerli bir iade tutarı girin.");
        if (amount > remaining + 0.001m) throw new AppException($"İade tutarı kalan iadeden ({remaining:0.##}) fazla olamaz.");

        r.RefundedAmount += amount;
        r.Status = r.RefundedAmount >= r.Amount - 0.001m ? "DONE" : "PARTIAL";
        if (!string.IsNullOrWhiteSpace(dto.Note)) r.Note = dto.Note.Trim();
        if (r.Status == "DONE") r.CompletedAt = DateTime.UtcNow;

        // Cari: iade edilen tutar kadar müşteri alacağını kapat (borç kaydı) — sadece cari müşteri varsa
        if (r.CustomerId.HasValue)
        {
            var cid = r.CustomerId.Value;
            var curDeb = await _db.CustomerLedger.Where(l => l.CustomerId == cid).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
            var curCre = await _db.CustomerLedger.Where(l => l.CustomerId == cid).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
            _db.CustomerLedger.Add(new CustomerLedgerEntry
            {
                CustomerId = cid,
                TransactionDate = dto.RefundDate ?? DateTime.UtcNow,
                TransactionType = "REFUND",
                Description = $"Sipariş {r.OrderCode} iade" + (string.IsNullOrWhiteSpace(dto.Note) ? "" : $" · {dto.Note.Trim()}"),
                Debit = amount,
                Credit = 0m,
                Balance = (curDeb - curCre) + amount,
                ReferenceType = "REFUND",
                OrderId = r.OrderId,
                OrderCode = r.OrderCode,
                CreatedBy = _current.Username,
                CreatedByUserId = _current.UserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Kasa çıkışı (müşteriye para iadesi)
        var pmName = dto.PaymentMethodId.HasValue && dto.PaymentMethodId.Value > 0
            ? await _db.PaymentMethods.Where(p => p.Id == dto.PaymentMethodId.Value).Select(p => p.Name).FirstOrDefaultAsync(ct)
            : null;
        _db.CashMovements.Add(new CashMovement
        {
            MovementType = "REFUND",
            Direction = "OUT",
            Amount = amount,
            OrderId = r.OrderId,
            CustomerId = r.CustomerId,
            PaymentMethod = pmName,
            Description = $"Sipariş {r.OrderCode} iade"
                + (string.IsNullOrWhiteSpace(r.CustomerName ?? r.RecipientName) ? "" : $" · {(r.CustomerName ?? r.RecipientName)}")
                + (string.IsNullOrWhiteSpace(dto.Note) ? "" : $" · {dto.Note.Trim()}"),
            TransactionDate = dto.RefundDate ?? DateTime.UtcNow,
            CreatedByUserId = _current.UserId,
            CreatedByUserName = _current.Username,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(ct);
        return Map(r);
    }

    public async Task<RefundSummaryDto> GetSummaryAsync(CancellationToken ct = default)
    {
        var open = await _db.Refunds.AsNoTracking()
            .Where(r => r.Status == "PENDING" || r.Status == "PARTIAL")
            .Select(r => new { r.Amount, r.RefundedAmount })
            .ToListAsync(ct);
        return new RefundSummaryDto
        {
            PendingCount = open.Count,
            PendingTotal = open.Sum(x => Math.Max(0m, x.Amount - x.RefundedAmount))
        };
    }
}
