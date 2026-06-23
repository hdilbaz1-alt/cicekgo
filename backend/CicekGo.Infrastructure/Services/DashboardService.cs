using CicekGo.Application.Dashboard;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly TenantDbContext _db;
    public DashboardService(TenantDbContext db) => _db = db;

    public async Task<DashboardSummaryDto> GetSummaryAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(from, to);

        // Siparişler sayfasıyla tutarlı olsun diye TESLİMAT tarihine göre filtrele (CreatedAt değil).
        var orders = _db.Orders.AsNoTracking().AsQueryable();
        if (f.HasValue) orders = orders.Where(o => o.DeliveryDate >= f.Value);
        if (tt.HasValue) orders = orders.Where(o => o.DeliveryDate < tt.Value);

        var cash = _db.CashMovements.AsNoTracking().AsQueryable();
        if (f.HasValue) cash = cash.Where(c => c.TransactionDate >= f.Value);
        if (tt.HasValue) cash = cash.Where(c => c.TransactionDate < tt.Value);

        var exp = _db.Expenses.AsNoTracking().AsQueryable();
        if (f.HasValue) exp = exp.Where(e => e.TransactionDate >= f.Value);
        if (tt.HasValue) exp = exp.Where(e => e.TransactionDate < tt.Value);

        var dto = new DashboardSummaryDto
        {
            OrderCount = await orders.CountAsync(ct),
            TotalSales = await orders.SumAsync(o => (decimal?)o.Amount, ct) ?? 0m,
            Collected = await cash.Where(c => c.MovementType == "COLLECTION").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m,
            ExpenseTotal = await exp.SumAsync(e => (decimal?)e.Amount, ct) ?? 0m,
            CriticalStockCount = await _db.Products.CountAsync(p => p.TrackStock && p.IsActive && p.CurrentStock <= p.CriticalStockLevel, ct),
        };

        var cashIn = await cash.Where(c => c.Direction == "IN").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;
        var cashOut = await cash.Where(c => c.Direction == "OUT").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;
        dto.NetCash = cashIn - cashOut;

        var deb = await _db.CustomerLedger.AsNoTracking().SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
        var cre = await _db.CustomerLedger.AsNoTracking().SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
        dto.OpenReceivables = deb - cre;

        dto.StatusCounts = await orders.GroupBy(o => o.Status)
            .Select(g => new StatusCountDto { Status = g.Key ?? "—", Count = g.Count() })
            .ToListAsync(ct);

        // Günlük kasa serisi (giriş/çıkış)
        var moves = await cash.Select(c => new { c.TransactionDate, c.Direction, c.Amount }).ToListAsync(ct);
        dto.CashSeries = moves
            .GroupBy(m => m.TransactionDate.Date)
            .OrderBy(g => g.Key)
            .Select(g => new CashPointDto
            {
                Date = g.Key.ToString("yyyy-MM-dd"),
                In = g.Where(x => x.Direction == "IN").Sum(x => x.Amount),
                Out = g.Where(x => x.Direction == "OUT").Sum(x => x.Amount)
            }).ToList();

        // Günlük satış serisi (sipariş tutarı) — teslimat tarihine göre
        var ordRows = await orders.Where(o => o.DeliveryDate != null).Select(o => new { o.DeliveryDate, o.Amount }).ToListAsync(ct);
        dto.SalesSeries = ordRows
            .GroupBy(o => o.DeliveryDate!.Value.Date)
            .OrderBy(g => g.Key)
            .Select(g => new SalesPointDto { Date = g.Key.ToString("yyyy-MM-dd"), Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToList();

        dto.TopProducts = await (from i in _db.OrderItems.AsNoTracking()
                                 join o in orders on i.OrderId equals o.Id
                                 group i by i.ProductName into g
                                 select new TopProductDto { Name = g.Key, Quantity = g.Sum(x => x.Quantity), Total = g.Sum(x => x.TotalPrice) })
            .OrderByDescending(x => x.Total).Take(5).ToListAsync(ct);

        dto.TopCustomers = await (from o in orders
                                  where o.CustomerId != null
                                  join c in _db.Customers.AsNoTracking() on o.CustomerId equals c.Id
                                  group new { o, c } by new { o.CustomerId, c.Name } into g
                                  select new TopCustomerDto { Name = g.Key.Name, OrderCount = g.Count(), Total = g.Sum(x => x.o.Amount) })
            .OrderByDescending(x => x.Total).Take(5).ToListAsync(ct);

        return dto;
    }
}
