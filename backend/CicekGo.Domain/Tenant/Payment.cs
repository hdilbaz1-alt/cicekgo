namespace CicekGo.Domain.Tenant;

/// <summary>Müşteri tahsilatı (cari ödeme). Sipariş bazlı ya da genel.</summary>
public class Payment
{
    public int Id { get; set; }

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;

    public int? OrderId { get; set; }

    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }            // Nakit / Kredi Kartı / Havale / Online
    public DateTime PaymentDate { get; set; }
    public string? Description { get; set; }
    public string? ReceiptNumber { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }

    public bool IsCancelled { get; set; }
    public DateTime? CancelledAt { get; set; }
    public int? CancelledByUserId { get; set; }
}
