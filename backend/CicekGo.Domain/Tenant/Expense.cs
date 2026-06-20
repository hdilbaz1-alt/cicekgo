namespace CicekGo.Domain.Tenant;

public class Expense
{
    public int Id { get; set; }
    public string Category { get; set; } = default!;      // Çiçek alımı / Kurye yakıt / Kira / Personel ...
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Description { get; set; }
    public DateTime TransactionDate { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
