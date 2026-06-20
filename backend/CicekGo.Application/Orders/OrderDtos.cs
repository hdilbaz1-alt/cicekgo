namespace CicekGo.Application.Orders;

public class OrderPaymentItemDto
{
    public decimal PaymentAmount { get; set; }
    public int? PaymentMethodId { get; set; }
    public DateTime? PaymentDate { get; set; }
}

public class OrderItemInputDto
{
    public int? ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
}

public class OrderItemDto
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalPrice { get; set; }
}

public class OrderCreateDto
{
    public string? OrderId { get; set; }                  // boşsa backend kod üretir (sequence)
    public string? OrderStatus { get; set; }
    public string? OrderSender { get; set; }
    public string? OrderTo { get; set; }
    public DateTime? OrderDeliveryDate { get; set; }
    public decimal? OrderAmount { get; set; }
    public decimal? OrderRemainingAmount { get; set; }
    public string? OrderProductType { get; set; }
    public int? CustomerId { get; set; }

    // Faz 2: kalemler + tutar kırılımı + kaynak/kurye
    public List<OrderItemInputDto>? Items { get; set; }
    public decimal? DiscountTotal { get; set; }
    public decimal? DeliveryFee { get; set; }
    public decimal? ExtraFee { get; set; }
    public string? Source { get; set; }
    public string? PaymentStatus { get; set; }
    public string? DeliveryTimeRange { get; set; }
    public int? AssignedCourierId { get; set; }
    public string? DeliveryNote { get; set; }

    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }

    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }

    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    public bool? IsNotified { get; set; }

    public List<OrderPaymentItemDto>? Payments { get; set; }
}

public class OrderUpdateDto
{
    public string? OrderStatus { get; set; }
    public string? OrderSender { get; set; }
    public string? OrderTo { get; set; }
    public DateTime? OrderDeliveryDate { get; set; }
    public decimal? OrderAmount { get; set; }
    public string? OrderProductType { get; set; }
    public int? CustomerId { get; set; }

    // Faz 2
    public List<OrderItemInputDto>? Items { get; set; }
    public bool? ReplaceItems { get; set; }
    public decimal? DiscountTotal { get; set; }
    public decimal? DeliveryFee { get; set; }
    public decimal? ExtraFee { get; set; }
    public string? Source { get; set; }
    public string? PaymentStatus { get; set; }
    public string? DeliveryTimeRange { get; set; }
    public int? AssignedCourierId { get; set; }
    public string? DeliveryNote { get; set; }

    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }

    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }

    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientAddress { get; set; }

    public bool? IsNotified { get; set; }

    public bool? ReplacePayments { get; set; }
    public List<OrderPaymentItemDto>? Payments { get; set; }
}

public class OrderListRequestDto
{
    public string? StartDate { get; set; }                // yyyy-MM-dd
    public string? EndDate { get; set; }                  // yyyy-MM-dd
    public int? CustomerId { get; set; }                  // verilirse tarih filtresi yoksayılır (örn. tahsilat seçici)
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

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
    public decimal OrderAmount { get; set; }
    public decimal OrderRemainingAmount { get; set; }
    public bool IsNotified { get; set; }
    public int? CustomerId { get; set; }

    public string? ExtraNote { get; set; }
    public string? CardNote { get; set; }
    public string? CustomerNote { get; set; }

    // Faz 2
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public decimal DeliveryFee { get; set; }
    public decimal ExtraFee { get; set; }
    public string? Source { get; set; }
    public string? PaymentStatus { get; set; }
    public string? DeliveryTimeRange { get; set; }
    public int? AssignedCourierId { get; set; }
    public string? AssignedCourierName { get; set; }
    public string? DeliveryNote { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class OrderCreateResultDto
{
    public int OrderPkId { get; set; }
    public string OrderCode { get; set; } = default!;
}

public class OrderMovementDto
{
    public int Id { get; set; }
    public DateTime Date { get; set; }
    public string MovementType { get; set; } = default!;   // COLLECTION / REFUND / ...
    public string Direction { get; set; } = default!;      // IN / OUT
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
}

public class OrderLedgerDto
{
    public string OrderCode { get; set; } = default!;
    public int? CustomerId { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? SenderName { get; set; }
    public string? SenderPhone { get; set; }
    public string? Status { get; set; }
    public decimal Amount { get; set; }
    public decimal Paid { get; set; }
    public decimal Remaining { get; set; }
    public List<OrderMovementDto> Movements { get; set; } = new();
}

public class OrderPayInputDto
{
    public decimal Amount { get; set; }
    public int? PaymentMethodId { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Description { get; set; }
}

public class OrderRefundInputDto
{
    public decimal Amount { get; set; }
    public int? PaymentMethodId { get; set; }
    public DateTime? RefundDate { get; set; }
    public string? Note { get; set; }
}

public class OrderDeleteDto
{
    public string? Reason { get; set; }
    public bool FeeRefunded { get; set; }          // ücret iade edildi mi? (Evet/Hayır)
    public DateTime? RefundPlannedDate { get; set; } // "Hayır" ise planlanan iade tarihi
    public int? RefundPaymentMethodId { get; set; }  // "Evet" ise iade yöntemi
}

public class AssignCourierDto
{
    public int? CourierUserId { get; set; }
}

public class ChangeStatusDto
{
    public string Status { get; set; } = default!;
    public string? Note { get; set; }
}

public class DeletedOrderItemDto
{
    public int OrderPkId { get; set; }
    public string OrderCode { get; set; } = default!;
    public string? RecipientName { get; set; }
    public string? SenderName { get; set; }
    public decimal OrderAmount { get; set; }
    public string? PaymentStatus { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedByUserName { get; set; }
    public string? DeleteReason { get; set; }
}
