namespace CicekGo.Application.Refunds;

public class RefundDto
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = default!;
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public decimal Amount { get; set; }
    public decimal RefundedAmount { get; set; }
    public decimal Remaining { get; set; }
    public string Status { get; set; } = default!;
    public string? Reason { get; set; }
    public DateTime? PlannedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Note { get; set; }
}

/// <summary>İade işleme: tam veya kısmi. Amount verilmezse kalanın tamamı iade edilir.</summary>
public class RefundProcessDto
{
    public decimal? Amount { get; set; }   // boş = kalanın tamamı (tam iade)
    public string? Note { get; set; }
    public DateTime? RefundDate { get; set; }
    public int? PaymentMethodId { get; set; }
}

public class RefundSummaryDto
{
    public int PendingCount { get; set; }
    public decimal PendingTotal { get; set; }   // bekleyen toplam (kalan)
}

public interface IRefundService
{
    Task<IReadOnlyList<RefundDto>> ListAsync(int? customerId, bool onlyOpen, CancellationToken ct = default);
    Task<IReadOnlyList<RefundDto>> SearchAsync(string? query, bool nonCariOnly, bool onlyOpen, CancellationToken ct = default);
    Task<RefundDto> ProcessAsync(int refundId, RefundProcessDto dto, CancellationToken ct = default);
    Task<RefundSummaryDto> GetSummaryAsync(CancellationToken ct = default);
}
