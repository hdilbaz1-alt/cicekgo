namespace CicekGo.Domain.Tenant;

public class OrderStatusHistory
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = default!;

    public string Status { get; set; } = default!;
    public int? ChangedByUserId { get; set; }
    public string? ChangedByUserName { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Note { get; set; }
}
