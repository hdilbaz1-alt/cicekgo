using CicekGo.Application.Common;
using CicekGo.Application.Orders;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class ProductTypeService : IProductTypeService
{
    private readonly TenantDbContext _db;
    public ProductTypeService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<ProductTypeDto>> GetAllAsync(CancellationToken ct = default) =>
        await _db.ProductTypes.AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new ProductTypeDto { Id = p.Id, ProductName = p.Name })
            .ToListAsync(ct);

    public async Task<int> AddAsync(ProductTypeAddRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ProductName))
            throw new AppException("ProductName is required.");

        var p = new ProductType { Name = request.ProductName.Trim() };
        _db.ProductTypes.Add(p);
        await _db.SaveChangesAsync(ct);
        return p.Id;
    }

    public async Task UpdateAsync(int id, ProductTypeUpdateRequest request, CancellationToken ct = default)
    {
        var p = await _db.ProductTypes.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("product type not found");
        if (!string.IsNullOrWhiteSpace(request.ProductName)) p.Name = request.ProductName.Trim();
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var p = await _db.ProductTypes.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("product type not found");
        _db.ProductTypes.Remove(p);
        await _db.SaveChangesAsync(ct);
    }
}
