using CicekGo.Application.Common;
using CicekGo.Application.PaymentMethods;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class PaymentMethodService : IPaymentMethodService
{
    private readonly TenantDbContext _db;
    public PaymentMethodService(TenantDbContext db) => _db = db;

    private async Task EnsureSeedAsync(CancellationToken ct)
    {
        var any = await _db.PaymentMethods.AnyAsync(ct);
        if (!any)
        {
            _db.PaymentMethods.AddRange(
                new PaymentMethod { Name = "Nakit", IsDefault = true, SortOrder = 1 },
                new PaymentMethod { Name = "Kredi Kartı", SortOrder = 2 },
                new PaymentMethod { Name = "Havale/EFT", SortOrder = 3 },
                new PaymentMethod { Name = "Diğer", SortOrder = 4 });
            await _db.SaveChangesAsync(ct);
            return;
        }
        // En az bir varsayılan olsun
        if (!await _db.PaymentMethods.AnyAsync(p => p.IsDefault && p.IsActive, ct))
        {
            var first = await _db.PaymentMethods.Where(p => p.IsActive).OrderBy(p => p.SortOrder).ThenBy(p => p.Id).FirstOrDefaultAsync(ct);
            if (first != null) { first.IsDefault = true; await _db.SaveChangesAsync(ct); }
        }
    }

    public async Task<IReadOnlyList<PaymentMethodDto>> ListAsync(CancellationToken ct = default)
    {
        await EnsureSeedAsync(ct);
        return await _db.PaymentMethods.AsNoTracking()
            .OrderByDescending(p => p.IsActive).ThenBy(p => p.SortOrder).ThenBy(p => p.Id)
            .Select(p => new PaymentMethodDto { Id = p.Id, Name = p.Name, IsActive = p.IsActive, IsDefault = p.IsDefault, SortOrder = p.SortOrder })
            .ToListAsync(ct);
    }

    public async Task<int> CreateAsync(PaymentMethodSaveDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("İsim gerekli.");
        var max = await _db.PaymentMethods.MaxAsync(p => (int?)p.SortOrder, ct) ?? 0;
        var pm = new PaymentMethod { Name = dto.Name.Trim(), IsActive = dto.IsActive, SortOrder = max + 1 };
        _db.PaymentMethods.Add(pm);
        await _db.SaveChangesAsync(ct);
        return pm.Id;
    }

    public async Task UpdateAsync(int id, PaymentMethodSaveDto dto, CancellationToken ct = default)
    {
        var pm = await _db.PaymentMethods.FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("payment method not found");
        if (!string.IsNullOrWhiteSpace(dto.Name)) pm.Name = dto.Name.Trim();
        pm.IsActive = dto.IsActive;
        if (!pm.IsActive) pm.IsDefault = false;
        await _db.SaveChangesAsync(ct);
        await EnsureSeedAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var pm = await _db.PaymentMethods.FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("payment method not found");
        _db.PaymentMethods.Remove(pm);
        await _db.SaveChangesAsync(ct);
        await EnsureSeedAsync(ct);
    }

    public async Task SetDefaultAsync(int id, CancellationToken ct = default)
    {
        var pm = await _db.PaymentMethods.FirstOrDefaultAsync(p => p.Id == id, ct) ?? throw new NotFoundException("payment method not found");
        var all = await _db.PaymentMethods.ToListAsync(ct);
        foreach (var p in all) p.IsDefault = p.Id == id;
        pm.IsActive = true;
        await _db.SaveChangesAsync(ct);
    }
}
