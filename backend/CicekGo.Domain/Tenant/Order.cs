namespace CicekGo.Domain.Tenant;

/// <summary>
/// Sipariş. Düz alanlar + çoklu kalem (OrderItems) + ödemeler (OrderPayment).
/// Soft delete uygulanır (IsDeleted).
/// </summary>
public class Order
{
    public int Id { get; set; }
    public string Code { get; set; } = default!;          // sipariş numarası (unique)

    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }            // Ödendi / Kısmi / Ödenmedi / Veresiye
    public string? Source { get; set; }                   // Telefon / WhatsApp / Instagram / Mağaza ...
    public string? ProductType { get; set; }              // (geriye dönük; kalemler order_items'ta)
    public DateTime? DeliveryDate { get; set; }
    public string? DeliveryTimeRange { get; set; }

    // Tutarlar
    public decimal SubTotal { get; set; }                 // kalemler toplamı
    public decimal DiscountTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal ExtraFee { get; set; }
    public decimal Amount { get; set; }                   // genel toplam (grand total)
    public decimal RemainingAmount { get; set; }          // kalan

    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public int? AssignedCourierId { get; set; }           // master users.id (cross-db, FK yok)

    public bool IsNotified { get; set; }

    // Gönderici / Alıcı
    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    // Notlar
    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }
    public string? DeliveryNote { get; set; }

    // Soft delete
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int? DeletedByUserId { get; set; }
    public string? DeletedByUserName { get; set; }
    public string? DeleteReason { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public int? UpdatedByUserId { get; set; }

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<OrderPayment> Payments { get; set; } = new List<OrderPayment>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
}
