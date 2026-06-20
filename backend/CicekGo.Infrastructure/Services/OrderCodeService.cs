using CicekGo.Application.Common;
using CicekGo.Application.Orders;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

/// <summary>Sipariş kodu üreteçleri (frontend OrderStartCode/OrderLastCode ile uyumlu).</summary>
public class OrderCodeService : IOrderCodeService
{
    private readonly TenantDbContext _db;
    public OrderCodeService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrderCodeDto>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.OrderCodeSequences.AsNoTracking()
            .OrderByDescending(s => s.Id)
            .Select(s => new OrderCodeDto
            {
                Id = s.Id,
                OrderStartCode = s.Prefix,
                OrderLastCode = s.NextNumber.ToString()
            })
            .ToListAsync(ct);
    }

    public async Task<int> CreateAsync(OrderCodeCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.OrderStartCode))
            throw new AppException("OrderStartCode is required.");

        if (await _db.OrderCodeSequences.AnyAsync(s => s.Prefix == dto.OrderStartCode, ct))
            throw new ConflictException("order code prefix already exists");

        var next = long.TryParse(dto.OrderLastCode, out var n) && n > 0 ? n : 1;
        var seq = new OrderCodeSequence { Prefix = dto.OrderStartCode.Trim(), NextNumber = next };
        _db.OrderCodeSequences.Add(seq);
        await _db.SaveChangesAsync(ct);
        return seq.Id;
    }

    public async Task UpdateAsync(int id, OrderCodeUpdateDto dto, CancellationToken ct = default)
    {
        var seq = await _db.OrderCodeSequences.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new NotFoundException("order code not found");

        if (!string.IsNullOrWhiteSpace(dto.OrderStartCode))
            seq.Prefix = dto.OrderStartCode.Trim();

        if (long.TryParse(dto.OrderLastCode, out var n) && n > 0)
            seq.NextNumber = n;

        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var seq = await _db.OrderCodeSequences.FirstOrDefaultAsync(s => s.Id == id, ct)
            ?? throw new NotFoundException("order code not found");
        _db.OrderCodeSequences.Remove(seq);
        await _db.SaveChangesAsync(ct);
    }
}
