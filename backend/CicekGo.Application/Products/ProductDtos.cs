namespace CicekGo.Application.Products;

public class ProductCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; }
}

public class ProductCategoryRequest
{
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string? Description { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? VatRate { get; set; }
    public bool TrackStock { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal CriticalStockLevel { get; set; }
    public string? Unit { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public class ProductCreateDto
{
    public string Name { get; set; } = default!;
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    public decimal SalePrice { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? VatRate { get; set; }
    public bool TrackStock { get; set; }
    public decimal CurrentStock { get; set; }
    public decimal CriticalStockLevel { get; set; }
    public string? Unit { get; set; } = "Adet";
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
}

public class ProductUpdateDto
{
    public string? Name { get; set; }
    public int? CategoryId { get; set; }
    public string? Description { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? PurchasePrice { get; set; }
    public decimal? VatRate { get; set; }
    public bool? TrackStock { get; set; }
    public decimal? CriticalStockLevel { get; set; }
    public string? Unit { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
}

public class StockMovementDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = default!;
    public string MovementType { get; set; } = default!;
    public decimal Quantity { get; set; }
    public decimal PreviousStock { get; set; }
    public decimal NewStock { get; set; }
    public string? Description { get; set; }
    public string? CreatedByUserName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class StockMovementCreateDto
{
    public int ProductId { get; set; }
    public string MovementType { get; set; } = "IN";   // IN / OUT / WASTE / ADJUST
    public decimal Quantity { get; set; }
    public string? Description { get; set; }
}
