using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Products;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IAuditLogger _audit;

    public ProductService(TenantDbContext db, ICurrentUser current, IAuditLogger audit)
    {
        _db = db;
        _current = current;
        _audit = audit;
    }

    private string? User => _current.Username;

    public async Task<IReadOnlyList<ProductDto>> GetAllAsync(string? search, CancellationToken ct = default)
    {
        var q = _db.Products.AsNoTracking().Include(p => p.Category).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var like = $"%{search.Trim()}%";
            q = q.Where(p => EF.Functions.ILike(p.Name, like));
        }
        return await q.OrderBy(p => p.Name).Select(p => Map(p)).ToListAsync(ct);
    }

    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken ct = default) =>
        await _db.Products.AsNoTracking().Include(p => p.Category)
            .Where(p => p.Id == id).Select(p => Map(p)).FirstOrDefaultAsync(ct);

    public async Task<int> CreateAsync(ProductCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Ürün adı gerekli.");
        var p = new Product
        {
            Name = dto.Name.Trim(),
            CategoryId = dto.CategoryId,
            Description = dto.Description,
            SalePrice = dto.SalePrice,
            PurchasePrice = dto.PurchasePrice,
            VatRate = dto.VatRate,
            TrackStock = dto.TrackStock,
            CurrentStock = dto.TrackStock ? dto.CurrentStock : 0,
            CriticalStockLevel = dto.CriticalStockLevel,
            Unit = dto.Unit,
            ImageUrl = dto.ImageUrl,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);

        if (dto.TrackStock && dto.CurrentStock != 0)
        {
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = p.Id, MovementType = "IN", Quantity = dto.CurrentStock,
                PreviousStock = 0, NewStock = dto.CurrentStock, Description = "Açılış stoğu",
                CreatedByUserId = _current.UserId, CreatedByUserName = User, CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(ct);
        }

        await _audit.LogAsync("CREATE", "Products", "Product", p.Id.ToString(), $"Ürün oluşturuldu: {p.Name}", ct: ct);
        return p.Id;
    }

    public async Task UpdateAsync(int id, ProductUpdateDto dto, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ürün bulunamadı");
        if (dto.Name is not null) p.Name = dto.Name.Trim();
        if (dto.CategoryId.HasValue) p.CategoryId = dto.CategoryId;
        if (dto.Description is not null) p.Description = dto.Description;
        if (dto.SalePrice.HasValue) p.SalePrice = dto.SalePrice.Value;
        if (dto.PurchasePrice.HasValue) p.PurchasePrice = dto.PurchasePrice;
        if (dto.VatRate.HasValue) p.VatRate = dto.VatRate;
        if (dto.TrackStock.HasValue) p.TrackStock = dto.TrackStock.Value;
        if (dto.CriticalStockLevel.HasValue) p.CriticalStockLevel = dto.CriticalStockLevel.Value;
        if (dto.Unit is not null) p.Unit = dto.Unit;
        if (dto.ImageUrl is not null) p.ImageUrl = dto.ImageUrl;
        if (dto.IsActive.HasValue) p.IsActive = dto.IsActive.Value;
        p.UpdatedAt = DateTime.UtcNow;
        p.UpdatedBy = User;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("UPDATE", "Products", "Product", p.Id.ToString(), $"Ürün güncellendi: {p.Name}", ct: ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ürün bulunamadı");
        // Stok hareketleri cascade; ama siparişlerde referans varsa pasifleştirmek daha güvenli olabilir.
        _db.Products.Remove(p);
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("DELETE", "Products", "Product", id.ToString(), $"Ürün silindi: {p.Name}", ct: ct);
    }

    public async Task<IReadOnlyList<ProductCategoryDto>> GetCategoriesAsync(CancellationToken ct = default) =>
        await _db.ProductCategories.AsNoTracking().OrderBy(c => c.Name)
            .Select(c => new ProductCategoryDto { Id = c.Id, Name = c.Name, IsActive = c.IsActive })
            .ToListAsync(ct);

    public async Task<int> CreateCategoryAsync(ProductCategoryRequest dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Kategori adı gerekli.");
        if (await _db.ProductCategories.AnyAsync(c => c.Name == dto.Name, ct))
            throw new ConflictException("Bu kategori zaten var.");
        var c = new ProductCategory { Name = dto.Name.Trim(), IsActive = dto.IsActive };
        _db.ProductCategories.Add(c);
        await _db.SaveChangesAsync(ct);
        return c.Id;
    }

    public async Task UpdateCategoryAsync(int id, ProductCategoryRequest dto, CancellationToken ct = default)
    {
        var c = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("kategori bulunamadı");
        if (!string.IsNullOrWhiteSpace(dto.Name)) c.Name = dto.Name.Trim();
        c.IsActive = dto.IsActive;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteCategoryAsync(int id, CancellationToken ct = default)
    {
        var c = await _db.ProductCategories.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("kategori bulunamadı");
        _db.ProductCategories.Remove(c);
        await _db.SaveChangesAsync(ct);
    }

    private static ProductDto Map(Product p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        CategoryId = p.CategoryId,
        CategoryName = p.Category != null ? p.Category.Name : null,
        Description = p.Description,
        SalePrice = p.SalePrice,
        PurchasePrice = p.PurchasePrice,
        VatRate = p.VatRate,
        TrackStock = p.TrackStock,
        CurrentStock = p.CurrentStock,
        CriticalStockLevel = p.CriticalStockLevel,
        Unit = p.Unit,
        ImageUrl = p.ImageUrl,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        CreatedBy = p.CreatedBy,
        UpdatedAt = p.UpdatedAt,
        UpdatedBy = p.UpdatedBy
    };
}
