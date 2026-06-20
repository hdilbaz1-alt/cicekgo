namespace CicekGo.Domain.Tenant;

public class StockMovement
{
    public int Id { get; set; }

    public int ProductId { get; set; }
    public Product Product { get; set; } = default!;

    public int? OrderId { get; set; }

    public string MovementType { get; set; } = default!;  // IN / OUT / ORDER_OUT / ORDER_RETURN / WASTE / ADJUST
    public decimal Quantity { get; set; }
    public decimal PreviousStock { get; set; }
    public decimal NewStock { get; set; }
    public string? Description { get; set; }

    public int? CreatedByUserId { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}
