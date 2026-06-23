using CicekGo.Application.Notifications;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

/// <summary>Web Push aboneliklerini Master DB'de saklar (endpoint bazlı upsert).</summary>
public class PushSubscriptionService : IPushSubscriptionService
{
    private readonly MasterDbContext _db;
    public PushSubscriptionService(MasterDbContext db) => _db = db;

    public async Task SaveAsync(int userId, int? tenantId, PushSubscribeDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Endpoint) || string.IsNullOrWhiteSpace(dto.P256dh) || string.IsNullOrWhiteSpace(dto.Auth))
            return;
        var row = await _db.PushSubscriptions.FirstOrDefaultAsync(x => x.Endpoint == dto.Endpoint, ct);
        if (row is null)
        {
            row = new PushSubscription { Endpoint = dto.Endpoint, CreatedAtUtc = DateTime.UtcNow };
            _db.PushSubscriptions.Add(row);
        }
        row.UserId = userId;
        row.TenantId = tenantId;
        row.P256dh = dto.P256dh;
        row.Auth = dto.Auth;
        row.UserAgent = dto.UserAgent;
        row.LastSeenUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(string endpoint, CancellationToken ct = default)
    {
        var row = await _db.PushSubscriptions.FirstOrDefaultAsync(x => x.Endpoint == endpoint, ct);
        if (row is not null) { _db.PushSubscriptions.Remove(row); await _db.SaveChangesAsync(ct); }
    }
}
