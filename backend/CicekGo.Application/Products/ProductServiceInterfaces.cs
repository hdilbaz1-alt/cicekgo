namespace CicekGo.Application.Products;

public interface IProductService
{
    Task<IReadOnlyList<ProductDto>> GetAllAsync(string? search, CancellationToken ct = default);
    Task<ProductDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(ProductCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, ProductUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);

    Task<IReadOnlyList<ProductCategoryDto>> GetCategoriesAsync(CancellationToken ct = default);
    Task<int> CreateCategoryAsync(ProductCategoryRequest dto, CancellationToken ct = default);
    Task UpdateCategoryAsync(int id, ProductCategoryRequest dto, CancellationToken ct = default);
    Task DeleteCategoryAsync(int id, CancellationToken ct = default);
}

public interface IStockService
{
    Task<IReadOnlyList<StockMovementDto>> GetMovementsAsync(int? productId, CancellationToken ct = default);
    Task<int> AddMovementAsync(StockMovementCreateDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<ProductDto>> GetCriticalAsync(CancellationToken ct = default);
}
