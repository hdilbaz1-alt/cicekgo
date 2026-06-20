using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Products;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class StockService : IStockService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;

    public StockService(TenantDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<StockMovementDto>> GetMovementsAsync(int? productId, CancellationToken ct = default)
    {
        var q = from m in _db.StockMovements.AsNoTracking()
                join p in _db.Products on m.ProductId equals p.Id
                select new { m, p.Name };
        if (productId.HasValue) q = q.Where(x => x.m.ProductId == productId.Value);

        return await q.OrderByDescending(x => x.m.Id).Take(500)
            .Select(x => new StockMovementDto
            {
                Id = x.m.Id,
                ProductId = x.m.ProductId,
                ProductName = x.Name,
                MovementType = x.m.MovementType,
                Quantity = x.m.Quantity,
                PreviousStock = x.m.PreviousStock,
                NewStock = x.m.NewStock,
                Description = x.m.Description,
                CreatedByUserName = x.m.CreatedByUserName,
                CreatedAt = x.m.CreatedAt
            }).ToListAsync(ct);
    }

    public async Task<int> AddMovementAsync(StockMovementCreateDto dto, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == dto.ProductId, ct)
            ?? throw new NotFoundException("ürün bulunamadı");
        if (!p.TrackStock) throw new AppException("Bu ürün için stok takibi kapalı.");
        if (dto.Quantity <= 0) throw new AppException("Miktar 0'dan büyük olmalı.");

        var prev = p.CurrentStock;
        var delta = dto.MovementType switch
        {
            "IN" => dto.Quantity,
            "OUT" or "WASTE" => -dto.Quantity,
            "ADJUST" => dto.Quantity - prev,   // ADJUST: yeni mutlak değere ayarla
            _ => throw new AppException("Geçersiz hareket tipi.")
        };
        var next = prev + delta;
        if (next < 0) throw new AppException("Stok negatife düşemez.");

        p.CurrentStock = next;
        p.UpdatedAt = DateTime.UtcNow;

        var mv = new StockMovement
        {
            ProductId = p.Id,
            MovementType = dto.MovementType,
            Quantity = Math.Abs(delta),
            PreviousStock = prev,
            NewStock = next,
            Description = dto.Description,
            CreatedByUserId = _current.UserId,
            CreatedByUserName = _current.Username,
            CreatedAt = DateTime.UtcNow
        };
        _db.StockMovements.Add(mv);
        await _db.SaveChangesAsync(ct);
        return mv.Id;
    }

    public async Task<IReadOnlyList<ProductDto>> GetCriticalAsync(CancellationToken ct = default) =>
        await _db.Products.AsNoTracking().Include(p => p.Category)
            .Where(p => p.TrackStock && p.IsActive && p.CurrentStock <= p.CriticalStockLevel)
            .OrderBy(p => p.CurrentStock)
            .Select(p => new ProductDto
            {
                Id = p.Id, Name = p.Name, CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : null,
                SalePrice = p.SalePrice, TrackStock = p.TrackStock,
                CurrentStock = p.CurrentStock, CriticalStockLevel = p.CriticalStockLevel,
                Unit = p.Unit, IsActive = p.IsActive
            }).ToListAsync(ct);
}
