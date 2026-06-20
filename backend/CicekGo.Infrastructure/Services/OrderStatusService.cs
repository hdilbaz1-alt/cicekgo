using CicekGo.Application.Common;
using CicekGo.Application.Orders;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class OrderStatusService : IOrderStatusService
{
    private readonly TenantDbContext _db;
    public OrderStatusService(TenantDbContext db) => _db = db;

    public const string CancelName = "İptal Edildi";
    private const string CancelColor = "#ef4444";

    private async Task EnsureSeedAsync(CancellationToken ct)
    {
        // "İptal Edildi" her firmada sistem durumu olarak bulunmalı (kırmızı, silinemez)
        var cancel = await _db.OrderStatuses.FirstOrDefaultAsync(s => s.Name == CancelName, ct);
        if (cancel == null)
        {
            var max = await _db.OrderStatuses.MaxAsync(s => (int?)s.SortOrder, ct) ?? 0;
            _db.OrderStatuses.Add(new OrderStatus { Name = CancelName, Color = CancelColor, IsSystem = true, SortOrder = max + 1, IsActive = true });
            await _db.SaveChangesAsync(ct);
        }
        else if (!cancel.IsSystem || string.IsNullOrEmpty(cancel.Color))
        {
            cancel.IsSystem = true;
            if (string.IsNullOrEmpty(cancel.Color)) cancel.Color = CancelColor;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<IReadOnlyList<OrderStatusDto>> GetAllAsync(CancellationToken ct = default)
    {
        await EnsureSeedAsync(ct);
        return await _db.OrderStatuses.AsNoTracking()
            .OrderBy(s => s.SortOrder).ThenBy(s => s.Id)
            .Select(s => new OrderStatusDto { Id = s.Id, StatusName = s.Name, Color = s.Color, SortOrder = s.SortOrder, IsSystem = s.IsSystem })
            .ToListAsync(ct);
    }

    public async Task<int> AddAsync(OrderStatusAddRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.StatusName)) throw new AppException("Durum adı gerekli.");
        var max = await _db.OrderStatuses.MaxAsync(s => (int?)s.SortOrder, ct) ?? 0;
        var s = new OrderStatus { Name = request.StatusName.Trim(), Color = request.Color, SortOrder = max + 1 };
        _db.OrderStatuses.Add(s);
        await _db.SaveChangesAsync(ct);
        return s.Id;
    }

    public async Task UpdateAsync(int id, OrderStatusUpdateRequest request, CancellationToken ct = default)
    {
        var s = await _db.OrderStatuses.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("order status not found");
        // Sistem durumu yeniden adlandırılamaz; sadece rengi değişebilir
        if (!s.IsSystem && !string.IsNullOrWhiteSpace(request.StatusName)) s.Name = request.StatusName.Trim();
        if (request.Color != null) s.Color = request.Color;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var s = await _db.OrderStatuses.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("order status not found");
        if (s.IsSystem) throw new AppException("Bu durum silinemez.");
        _db.OrderStatuses.Remove(s);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReorderAsync(OrderStatusReorderRequest request, CancellationToken ct = default)
    {
        var all = await _db.OrderStatuses.ToListAsync(ct);
        var order = 1;
        foreach (var id in request.Ids)
        {
            var s = all.FirstOrDefault(x => x.Id == id);
            if (s != null) s.SortOrder = order++;
        }
        foreach (var s in all.Where(x => !request.Ids.Contains(x.Id)).OrderBy(x => x.SortOrder))
            s.SortOrder = order++;
        await _db.SaveChangesAsync(ct);
    }
}
