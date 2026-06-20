namespace cicekgo.Core.Customers.Dtos;

public class CustomerOrderPaymentDto
{
    public int CustomerId { get; set; }
    public string OrderCode { get; set; } = string.Empty; // Sipariş kodu
    public decimal Amount { get; set; } // Ödeme tutarı
    public string? Description { get; set; } // Açıklama
    public int PaymentMethodId { get; set; } // Ödeme yöntemi
    public DateTime? PaymentDate { get; set; } // Ödeme tarihi (null ise bugün)
}
