using CicekGo.Application.Notifications;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

/// <summary>Kalıcı bildirim akışı (zil listesi + okundu yönetimi). Master DB.</summary>
public class NotificationFeedService : INotificationFeedService
{
    private readonly MasterDbContext _db;
    public NotificationFeedService(MasterDbContext db) => _db = db;

    public async Task AddAsync(int userId, int? tenantId, string title, string body, string? url, string? type, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            TenantId = tenantId,
            Title = title,
            Body = body,
            Url = url,
            Type = type,
            IsRead = false,
            CreatedAtUtc = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<NotificationItemDto>> ListAsync(int userId, int take = 50, CancellationToken ct = default)
        => await _db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(Math.Clamp(take, 1, 100))
            .Select(n => new NotificationItemDto
            {
                Id = n.Id, Title = n.Title, Body = n.Body, Url = n.Url, Type = n.Type,
                IsRead = n.IsRead, CreatedAtUtc = n.CreatedAtUtc,
            })
            .ToListAsync(ct);

    public async Task<int> UnreadCountAsync(int userId, CancellationToken ct = default)
        => await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task MarkReadAsync(int userId, int id, CancellationToken ct = default)
        => await _db.Notifications.Where(n => n.UserId == userId && n.Id == id && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAtUtc, DateTime.UtcNow), ct);

    public async Task MarkAllReadAsync(int userId, CancellationToken ct = default)
        => await _db.Notifications.Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true).SetProperty(n => n.ReadAtUtc, DateTime.UtcNow), ct);
}
