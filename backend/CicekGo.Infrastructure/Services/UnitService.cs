using CicekGo.Application.Common;
using CicekGo.Application.Products;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class UnitService : IUnitService
{
    private readonly TenantDbContext _db;
    public UnitService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<UnitDto>> GetAllAsync(CancellationToken ct = default) =>
        await _db.Units.AsNoTracking()
            .OrderBy(u => u.SortOrder).ThenBy(u => u.Name)
            .Select(u => new UnitDto { Id = u.Id, Name = u.Name, SortOrder = u.SortOrder, IsActive = u.IsActive })
            .ToListAsync(ct);

    public async Task<int> CreateAsync(UnitRequest dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Birim adı gerekli.");
        if (await _db.Units.AnyAsync(u => u.Name == dto.Name, ct)) throw new ConflictException("Bu birim zaten var.");
        var u = new Unit { Name = dto.Name.Trim(), SortOrder = dto.SortOrder, IsActive = dto.IsActive };
        _db.Units.Add(u);
        await _db.SaveChangesAsync(ct);
        return u.Id;
    }

    public async Task UpdateAsync(int id, UnitRequest dto, CancellationToken ct = default)
    {
        var u = await _db.Units.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("birim bulunamadı");
        if (!string.IsNullOrWhiteSpace(dto.Name)) u.Name = dto.Name.Trim();
        u.SortOrder = dto.SortOrder;
        u.IsActive = dto.IsActive;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var u = await _db.Units.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("birim bulunamadı");
        _db.Units.Remove(u);
        await _db.SaveChangesAsync(ct);
    }
}
