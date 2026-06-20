using CicekGo.Application.Finance;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class CashService : ICashService
{
    private readonly TenantDbContext _db;
    public CashService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<CashMovementDto>> GetMovementsAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(from, to);
        var q = _db.CashMovements.AsNoTracking().AsQueryable();
        if (f.HasValue) q = q.Where(c => c.TransactionDate >= f.Value);
        if (tt.HasValue) q = q.Where(c => c.TransactionDate < tt.Value);
        return await q.OrderByDescending(c => c.TransactionDate).ThenByDescending(c => c.Id).Take(1000)
            .Select(c => new CashMovementDto
            {
                Id = c.Id, MovementType = c.MovementType, Direction = c.Direction, Amount = c.Amount,
                PaymentMethod = c.PaymentMethod, Description = c.Description, TransactionDate = c.TransactionDate
            }).ToListAsync(ct);
    }

    public async Task<GeneralSummaryDto> GetSummaryAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(from, to);
        var ordersQ = _db.Orders.AsNoTracking().AsQueryable();
        if (f.HasValue) ordersQ = ordersQ.Where(o => o.CreatedAt >= f.Value);
        if (tt.HasValue) ordersQ = ordersQ.Where(o => o.CreatedAt < tt.Value);

        var cashQ = _db.CashMovements.AsNoTracking().AsQueryable();
        if (f.HasValue) cashQ = cashQ.Where(c => c.TransactionDate >= f.Value);
        if (tt.HasValue) cashQ = cashQ.Where(c => c.TransactionDate < tt.Value);

        var totalSales = await ordersQ.SumAsync(o => (decimal?)o.Amount, ct) ?? 0m;
        var orderCount = await ordersQ.CountAsync(ct);
        var cashIn = await cashQ.Where(c => c.Direction == "IN").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;
        var cashOut = await cashQ.Where(c => c.Direction == "OUT").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;
        var collected = await cashQ.Where(c => c.MovementType == "COLLECTION").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;

        var expQ = _db.Expenses.AsNoTracking().AsQueryable();
        if (f.HasValue) expQ = expQ.Where(e => e.TransactionDate >= f.Value);
        if (tt.HasValue) expQ = expQ.Where(e => e.TransactionDate < tt.Value);
        var expenseTotal = await expQ.SumAsync(e => (decimal?)e.Amount, ct) ?? 0m;

        // Açık alacak: tüm müşteriler net (debit - credit) — dönemden bağımsız güncel durum
        var deb = await _db.CustomerLedger.AsNoTracking().SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
        var cre = await _db.CustomerLedger.AsNoTracking().SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;

        return new GeneralSummaryDto
        {
            TotalSales = totalSales,
            TotalCollected = collected,
            OpenReceivables = deb - cre,
            CashIn = cashIn,
            CashOut = cashOut,
            ExpenseTotal = expenseTotal,
            NetCash = cashIn - cashOut,
            OrderCount = orderCount
        };
    }
}
