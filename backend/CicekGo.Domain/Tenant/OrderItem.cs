namespace CicekGo.Domain.Tenant;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order Order { get; set; } = default!;

    public int? ProductId { get; set; }                   // katalogdan (opsiyonel)
    public Product? Product { get; set; }

    public string ProductName { get; set; } = default!;   // snapshot
    public decimal Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalPrice { get; set; }
    public bool IsStockTracked { get; set; }
}
