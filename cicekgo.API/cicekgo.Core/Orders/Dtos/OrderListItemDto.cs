namespace cicekgo.Core.Orders.Dtos;

public class OrderListItemDto
{
    public int OrderPkId { get; set; }
    public string OrderCode { get; set; } = default!;
    public string? OrderStatus { get; set; }
    public string? ProductType { get; set; }
    public DateTime CreatedDate { get; set; }
    public DateTime? DeliveryDate { get; set; }
    public string? CreatedUser { get; set; }

    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }

    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    public decimal TotalPaid { get; set; }
    public DateTime? LastPaymentDate { get; set; }
    public double? OrderAmount { get; set; }
    public double? OrderRemainingAmount { get; set; }
    public bool IsNotified { get; set; }
    public int? CustomerId { get; set; } // Müşteri ID'si

    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }
}
