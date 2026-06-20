namespace cicekgo.Core.Orders.Dtos;

public class OrderCreateDto
{
    // Orders
    public string OrderId { get; set; } = default!;          // NVARCHAR(50) - zorunlu
    public string? OrderStatus { get; set; }                 // NVARCHAR(50) - opsiyonel (yoksa NULL)
    public string? OrderSender { get; set; }                 // NVARCHAR(250)
    public string? OrderTo { get; set; }                     // NVARCHAR(250)
    public DateTime? OrderDeliveryDate { get; set; }         // DATETIME
    public double? OrderAmount { get; set; }                 // FLOAT
    public double? OrderRemainingAmount { get; set; }        // FLOAT
    public string? OrderProductType { get; set; }            // NVARCHAR(50)
    public int? CustomerId { get; set; }                     // Cari hesap için müşteri ID

    // Notes (opsiyonel)
    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }

    // Sender (opsiyonel tablo)
    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }

    // Recipient (opsiyonel tablo)
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    // Notification (opsiyonel tablo)
    public bool? IsNotified { get; set; } // null ise tabloya yazmayız; true/false gelirse yazarız

    // Payments (opsiyonel 0..n)
    public List<OrderPaymentItemDto>? Payments { get; set; }
}

public class OrderPaymentItemDto
{
    public decimal PaymentAmount { get; set; }     // decimal(10,2)
    public int PaymentMethodId { get; set; }       // int
    public DateTime? PaymentDate { get; set; }     // null ise default(getdate())
}
