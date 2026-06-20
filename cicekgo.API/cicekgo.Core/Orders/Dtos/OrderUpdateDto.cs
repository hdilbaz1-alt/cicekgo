namespace cicekgo.Core.Orders.Dtos;

public class OrderUpdateDto
{
    // Hedef kayıt (route ile de gelebilir)
    public int OrderPkId { get; set; }   // dbo.Orders.Id

    // Orders (null gelen alanlar DEĞİŞTİRİLMEZ)
    public string? OrderStatus { get; set; }            // NVARCHAR(50)
    public string? OrderSender { get; set; }            // NVARCHAR(250)
    public string? OrderTo { get; set; }                // NVARCHAR(250)
    public DateTime? OrderDeliveryDate { get; set; }    // DATETIME
    public double? OrderAmount { get; set; }            // FLOAT
    // OrderRemainingAmount güncelleme sırasında değiştirilemez
    public string? OrderProductType { get; set; }       // NVARCHAR(50)
    public int? CustomerId { get; set; }               // Müşteri ID'si

    // Notes (en az bir alan null-dışı ise upsert; null alanlar mevcut değeri korur)
    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }

    // Sender (en az bir alan null-dışı ise upsert)
    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }

    // Recipient (en az bir alan null-dışı ise upsert)
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    // Notification (varsa upsert)
    public bool? IsNotified { get; set; }

    // Payments:
    // ReplacePayments = true → mevcut ödemeleri sil, verilen listeyi baştan yaz
    // ReplacePayments = false (veya null) ve Payments listesi varsa → listedekileri EKLE
    public bool? ReplacePayments { get; set; }
    public List<OrderPaymentItemDto>? Payments { get; set; }
}
