namespace CicekGo.Application.Reports;

public class DayPointDto { public string Date { get; set; } = default!; public int Count { get; set; } public decimal Total { get; set; } }
public class StatusRowDto { public string Status { get; set; } = default!; public int Count { get; set; } public decimal Total { get; set; } }

public class SalesReportDto
{
    public int OrderCount { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal AvgOrder { get; set; }
    public List<DayPointDto> ByDay { get; set; } = new();
    public List<StatusRowDto> ByStatus { get; set; } = new();
}

public class ProductRowDto { public string Name { get; set; } = default!; public decimal Quantity { get; set; } public decimal Revenue { get; set; } public int OrderCount { get; set; } }
public class CustomerRowDto { public string Name { get; set; } = default!; public int OrderCount { get; set; } public decimal Total { get; set; } public decimal Collected { get; set; } public decimal Balance { get; set; } }
public class CategoryRowDto { public string Category { get; set; } = default!; public decimal Total { get; set; } }
public class CashTypeRowDto { public string Type { get; set; } = default!; public string Direction { get; set; } = default!; public decimal Total { get; set; } public int Count { get; set; } }

public class CashMethodRowDto { public string Method { get; set; } = default!; public decimal In { get; set; } public decimal Out { get; set; } public decimal Net { get; set; } public int Count { get; set; } }

public class CashReportDto
{
    public decimal In { get; set; }
    public decimal Out { get; set; }
    public decimal Net { get; set; }
    public List<CashTypeRowDto> ByType { get; set; } = new();
    public List<CashMethodRowDto> ByMethod { get; set; } = new();
    public List<CategoryRowDto> ExpensesByCategory { get; set; } = new();
}

public class CourierRowDto { public string Name { get; set; } = default!; public int OrderCount { get; set; } public int DeliveredCount { get; set; } public decimal Total { get; set; } }

public interface IReportService
{
    Task<SalesReportDto> SalesAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<IReadOnlyList<ProductRowDto>> ProductsAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<IReadOnlyList<CustomerRowDto>> CustomersAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<CashReportDto> CashAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<IReadOnlyList<CourierRowDto>> CouriersAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
}
