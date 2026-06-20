namespace CicekGo.Application.Dashboard;

public class StatusCountDto { public string Status { get; set; } = default!; public int Count { get; set; } }
public class CashPointDto { public string Date { get; set; } = default!; public decimal In { get; set; } public decimal Out { get; set; } }
public class SalesPointDto { public string Date { get; set; } = default!; public decimal Total { get; set; } public int Count { get; set; } }
public class TopProductDto { public string Name { get; set; } = default!; public decimal Quantity { get; set; } public decimal Total { get; set; } }
public class TopCustomerDto { public string Name { get; set; } = default!; public int OrderCount { get; set; } public decimal Total { get; set; } }

public class DashboardSummaryDto
{
    public int OrderCount { get; set; }
    public decimal TotalSales { get; set; }
    public decimal Collected { get; set; }
    public decimal OpenReceivables { get; set; }
    public decimal NetCash { get; set; }
    public decimal ExpenseTotal { get; set; }
    public int CriticalStockCount { get; set; }
    public List<StatusCountDto> StatusCounts { get; set; } = new();
    public List<CashPointDto> CashSeries { get; set; } = new();
    public List<SalesPointDto> SalesSeries { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
}

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
}
