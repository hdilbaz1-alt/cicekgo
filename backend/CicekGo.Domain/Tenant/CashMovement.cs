namespace CicekGo.Domain.Tenant;

/// <summary>Kasa hareketi (giriş/çıkış).</summary>
public class CashMovement
{
    public int Id { get; set; }

    public int? CustomerId { get; set; }
    public int? OrderId { get; set; }
    public int? PaymentId { get; set; }

    public string MovementType { get; set; } = default!;  // SALE / COLLECTION / REFUND / EXPENSE / ADJUST
    public string Direction { get; set; } = default!;     // IN / OUT
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
