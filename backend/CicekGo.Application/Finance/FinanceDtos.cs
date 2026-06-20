namespace CicekGo.Application.Finance;

public class ExpenseDto
{
    public int Id { get; set; }
    public string Category { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? CreatedByUserName { get; set; }
}

public class ExpenseCreateDto
{
    public string Category { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
    public DateTime? TransactionDate { get; set; }
}

public class CashMovementDto
{
    public int Id { get; set; }
    public string MovementType { get; set; } = default!;
    public string Direction { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }
}

public class GeneralSummaryDto
{
    public decimal TotalSales { get; set; }          // dönemdeki sipariş tutarı
    public decimal TotalCollected { get; set; }      // tahsilat (kasa girişi)
    public decimal OpenReceivables { get; set; }     // toplam açık alacak (tüm müşteriler)
    public decimal CashIn { get; set; }
    public decimal CashOut { get; set; }
    public decimal ExpenseTotal { get; set; }
    public decimal NetCash { get; set; }
    public int OrderCount { get; set; }
}

public class FinanceRangeRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public interface IExpenseService
{
    Task<IReadOnlyList<ExpenseDto>> GetAllAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<int> CreateAsync(ExpenseCreateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

public interface ICashService
{
    Task<IReadOnlyList<CashMovementDto>> GetMovementsAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
    Task<GeneralSummaryDto> GetSummaryAsync(DateTime? from, DateTime? to, CancellationToken ct = default);
}
