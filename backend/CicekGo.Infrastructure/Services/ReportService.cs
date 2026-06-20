using CicekGo.Application.Reports;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly TenantDbContext _db;
    private readonly MasterDbContext _master;
    public ReportService(TenantDbContext db, MasterDbContext master) { _db = db; _master = master; }

    private IQueryable<Domain.Tenant.Order> Orders(DateTime? from, DateTime? to)
    {
        var (f, tt) = DateRange.Utc(from, to);
        var q = _db.Orders.AsNoTracking().AsQueryable();
        if (f.HasValue) q = q.Where(o => o.CreatedAt >= f.Value);
        if (tt.HasValue) q = q.Where(o => o.CreatedAt < tt.Value);
        return q;
    }

    public async Task<SalesReportDto> SalesAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var orders = Orders(from, to);
        var dto = new SalesReportDto
        {
            OrderCount = await orders.CountAsync(ct),
            TotalSales = await orders.SumAsync(o => (decimal?)o.Amount, ct) ?? 0m,
        };
        dto.AvgOrder = dto.OrderCount > 0 ? Math.Round(dto.TotalSales / dto.OrderCount, 2) : 0m;

        var (f, tt) = DateRange.Utc(from, to);
        var cash = _db.CashMovements.AsNoTracking().Where(c => c.MovementType == "COLLECTION");
        if (f.HasValue) cash = cash.Where(c => c.TransactionDate >= f.Value);
        if (tt.HasValue) cash = cash.Where(c => c.TransactionDate < tt.Value);
        dto.TotalCollected = await cash.SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;

        var raw = await orders.Select(o => new { o.CreatedAt, o.Amount, o.Status }).ToListAsync(ct);
        dto.ByDay = raw.GroupBy(o => o.CreatedAt.Date).OrderBy(g => g.Key)
            .Select(g => new DayPointDto { Date = g.Key.ToString("yyyy-MM-dd"), Count = g.Count(), Total = g.Sum(x => x.Amount) }).ToList();
        dto.ByStatus = raw.GroupBy(o => o.Status ?? "—")
            .Select(g => new StatusRowDto { Status = g.Key, Count = g.Count(), Total = g.Sum(x => x.Amount) })
            .OrderByDescending(x => x.Count).ToList();
        return dto;
    }

    public async Task<IReadOnlyList<ProductRowDto>> ProductsAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var orders = Orders(from, to);
        return await (from i in _db.OrderItems.AsNoTracking()
                      join o in orders on i.OrderId equals o.Id
                      group i by i.ProductName into g
                      select new ProductRowDto
                      {
                          Name = g.Key,
                          Quantity = g.Sum(x => x.Quantity),
                          Revenue = g.Sum(x => x.TotalPrice),
                          OrderCount = g.Select(x => x.OrderId).Distinct().Count()
                      }).OrderByDescending(x => x.Revenue).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CustomerRowDto>> CustomersAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var orders = Orders(from, to);
        var rows = await (from o in orders
                          where o.CustomerId != null
                          join c in _db.Customers.AsNoTracking() on o.CustomerId equals c.Id
                          group new { o, c } by new { o.CustomerId, c.Name } into g
                          select new { g.Key.CustomerId, g.Key.Name, OrderCount = g.Count(), Total = g.Sum(x => x.o.Amount) })
            .OrderByDescending(x => x.Total).ToListAsync(ct);

        var result = new List<CustomerRowDto>();
        foreach (var r in rows)
        {
            var deb = await _db.CustomerLedger.AsNoTracking().Where(l => l.CustomerId == r.CustomerId).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
            var cre = await _db.CustomerLedger.AsNoTracking().Where(l => l.CustomerId == r.CustomerId).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
            var collected = await _db.CashMovements.AsNoTracking().Where(m => m.CustomerId == r.CustomerId && m.MovementType == "COLLECTION").SumAsync(m => (decimal?)m.Amount, ct) ?? 0m;
            result.Add(new CustomerRowDto { Name = r.Name, OrderCount = r.OrderCount, Total = r.Total, Collected = collected, Balance = deb - cre });
        }
        return result;
    }

    public async Task<CashReportDto> CashAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(from, to);
        var cash = _db.CashMovements.AsNoTracking().AsQueryable();
        if (f.HasValue) cash = cash.Where(c => c.TransactionDate >= f.Value);
        if (tt.HasValue) cash = cash.Where(c => c.TransactionDate < tt.Value);

        var dto = new CashReportDto
        {
            In = await cash.Where(c => c.Direction == "IN").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m,
            Out = await cash.Where(c => c.Direction == "OUT").SumAsync(c => (decimal?)c.Amount, ct) ?? 0m,
        };
        dto.Net = dto.In - dto.Out;
        dto.ByType = await cash.GroupBy(c => new { c.MovementType, c.Direction })
            .Select(g => new CashTypeRowDto { Type = g.Key.MovementType, Direction = g.Key.Direction, Total = g.Sum(x => x.Amount), Count = g.Count() })
            .ToListAsync(ct);

        // Ödeme yöntemine göre kırılım (girişler tahsilat, çıkışlar iade)
        var methodRows = await cash
            .GroupBy(c => c.PaymentMethod)
            .Select(g => new
            {
                Method = g.Key,
                In = g.Where(x => x.Direction == "IN").Sum(x => (decimal?)x.Amount) ?? 0m,
                Out = g.Where(x => x.Direction == "OUT").Sum(x => (decimal?)x.Amount) ?? 0m,
                Count = g.Count()
            })
            .ToListAsync(ct);
        dto.ByMethod = methodRows
            .Select(r => new CashMethodRowDto { Method = string.IsNullOrWhiteSpace(r.Method) ? "Belirtilmemiş" : r.Method!, In = r.In, Out = r.Out, Net = r.In - r.Out, Count = r.Count })
            .OrderByDescending(x => x.In + x.Out).ToList();

        var exp = _db.Expenses.AsNoTracking().AsQueryable();
        if (f.HasValue) exp = exp.Where(e => e.TransactionDate >= f.Value);
        if (tt.HasValue) exp = exp.Where(e => e.TransactionDate < tt.Value);
        dto.ExpensesByCategory = await exp.GroupBy(e => e.Category)
            .Select(g => new CategoryRowDto { Category = g.Key, Total = g.Sum(x => x.Amount) })
            .OrderByDescending(x => x.Total).ToListAsync(ct);
        return dto;
    }

    public async Task<IReadOnlyList<CourierRowDto>> CouriersAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var orders = Orders(from, to);
        var rows = await orders.Where(o => o.AssignedCourierId != null)
            .GroupBy(o => o.AssignedCourierId!.Value)
            .Select(g => new
            {
                CourierId = g.Key,
                OrderCount = g.Count(),
                DeliveredCount = g.Count(x => x.Status == "Teslim Edildi"),
                Total = g.Sum(x => x.Amount)
            }).ToListAsync(ct);

        var ids = rows.Select(r => r.CourierId).ToList();
        var names = await _master.Users.AsNoTracking().Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName ?? u.Username, ct);

        return rows.Select(r => new CourierRowDto
        {
            Name = names.TryGetValue(r.CourierId, out var n) ? n : $"#{r.CourierId}",
            OrderCount = r.OrderCount, DeliveredCount = r.DeliveredCount, Total = r.Total
        }).OrderByDescending(x => x.OrderCount).ToList();
    }
}
