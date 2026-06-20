namespace CicekGo.Domain.Tenant;

/// <summary>Cari hesap hareketi. Bakiye (Balance) her harekette güncel kümülatif değerdir.</summary>
public class CustomerLedgerEntry
{
    public int Id { get; set; }

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;

    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = default!;   // ORDER | PAYMENT | ADJUSTMENT
    public string? Description { get; set; }

    public decimal Debit { get; set; }                        // borç (sipariş tutarı)
    public decimal Credit { get; set; }                       // alacak (ödeme tutarı)
    public decimal Balance { get; set; }                      // kümülatif bakiye

    public int? ReferenceId { get; set; }                     // OrderId / PaymentId
    public string? ReferenceType { get; set; }                // ORDER | PAYMENT | ORDER_PAYMENT
    public int? OrderId { get; set; }
    public int? PaymentId { get; set; }
    public string? OrderCode { get; set; }
    public string? CustomerNote { get; set; }

    public string? CreatedBy { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }

    // Ters kayıt (sipariş silme düzeltmesi)
    public bool IsReversed { get; set; }
    public DateTime? ReversedAt { get; set; }
    public int? ReversedByUserId { get; set; }
}
