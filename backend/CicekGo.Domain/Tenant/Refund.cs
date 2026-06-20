namespace CicekGo.Domain.Tenant;

/// <summary>
/// Silinen bir siparişin müşteriye iade edilmesi gereken (ödenen) tutarı.
/// Cari bakiyeden ayrı tutulur; bekleyen/kısmi/tamamlanan olarak izlenir.
/// </summary>
public class Refund
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public string OrderCode { get; set; } = default!;

    public int? CustomerId { get; set; }          // cari müşteri yoksa null
    public string? CustomerName { get; set; }
    public string? RecipientName { get; set; }     // cari olmayan: alıcı/gönderici adı
    public string? RecipientPhone { get; set; }    // cari olmayan: telefon (aramak için)

    public decimal Amount { get; set; }            // iade edilmesi gereken toplam (silme anındaki ödenen tutar)
    public decimal RefundedAmount { get; set; }    // şimdiye dek iade edilen

    public string Status { get; set; } = "PENDING"; // PENDING | PARTIAL | DONE | CANCELLED
    public string? Reason { get; set; }             // sipariş silme sebebi
    public DateTime? PlannedDate { get; set; }      // "Hayır" seçilince planlanan iade tarihi

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Note { get; set; }
}
