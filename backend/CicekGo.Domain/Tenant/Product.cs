namespace CicekGo.Domain.Tenant;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;

    public int? CategoryId { get; set; }
    public ProductCategory? Category { get; set; }

    public string? Description { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? VatRate { get; set; }

    public bool TrackStock { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal CriticalStockLevel { get; set; }

    public string? Unit { get; set; }                     // Adet / Demet / Buket / Kutu ...
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
