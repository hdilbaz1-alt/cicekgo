using System.Net;
using System.Text.Json;
using CicekGo.Application.Common;
using CicekGo.Application.Notifications;
using CicekGo.Application.Platform;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebPush;
using WebPushSubscription = WebPush.PushSubscription;
using PushSubscription = CicekGo.Domain.Master.PushSubscription;

namespace CicekGo.Infrastructure.Services;

/// <summary>VAPID ile Web Push gönderimi. Ölü abonelikleri (404/410) temizler. Hata fırlatmaz.</summary>
public class PushNotificationService : IPushNotificationService
{
    private readonly MasterDbContext _db;
    private readonly IPlatformSettingsService _platform;
    private readonly INotificationFeedService _feed;
    private readonly ILogger<PushNotificationService> _log;

    public PushNotificationService(MasterDbContext db, IPlatformSettingsService platform, INotificationFeedService feed, ILogger<PushNotificationService> log)
    {
        _db = db; _platform = platform; _feed = feed; _log = log;
    }

    public async Task SendToUserAsync(int userId, NotificationPayload payload, CancellationToken ct = default)
    {
        // Önce kalıcı kayıt (zil listesi) — cihaz aboneliği olmasa bile bildirim görünür
        await _feed.AddAsync(userId, null, payload.Title, payload.Body, payload.Url, payload.Tag, ct);
        var subs = await _db.PushSubscriptions.Where(s => s.UserId == userId).ToListAsync(ct);
        await SendManyAsync(subs, payload, ct);
    }

    public async Task<int> BroadcastAsync(BroadcastDto dto, int? callerTenantId, bool isPlatformAdmin, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title)) throw new AppException("Başlık gerekli.");
        IQueryable<PushSubscription> q = _db.PushSubscriptions;
        IQueryable<User> uq = _db.Users.Where(u => u.IsActive);

        if (isPlatformAdmin && string.Equals(dto.Scope, "all", StringComparison.OrdinalIgnoreCase))
        {
            // tüm platform
        }
        else
        {
            var tid = isPlatformAdmin ? dto.TenantId : callerTenantId;
            if (tid is null) throw new AppException("Hedef firma belirlenemedi.");
            q = q.Where(s => s.TenantId == tid);
            uq = uq.Where(u => u.TenantId == tid);
        }

        // Kalıcı kayıt: kapsamdaki tüm kullanıcılar için (toplu)
        var targets = await uq.Select(u => new { u.Id, u.TenantId }).ToListAsync(ct);
        if (targets.Count > 0)
        {
            var now = DateTime.UtcNow;
            _db.Notifications.AddRange(targets.Select(t => new Notification
            {
                UserId = t.Id, TenantId = t.TenantId, Title = dto.Title, Body = dto.Body,
                Url = dto.Url, Type = "broadcast", IsRead = false, CreatedAtUtc = now,
            }));
            await _db.SaveChangesAsync(ct);
        }

        var subs = await q.ToListAsync(ct);
        await SendManyAsync(subs, new NotificationPayload { Title = dto.Title, Body = dto.Body, Url = dto.Url }, ct);
        return subs.Count;
    }

    private async Task SendManyAsync(List<PushSubscription> subs, NotificationPayload payload, CancellationToken ct)
    {
        if (subs.Count == 0) return;
        VapidKeys vapid;
        try { vapid = await _platform.EnsureVapidAsync(ct); }
        catch (Exception ex) { _log.LogWarning(ex, "VAPID alınamadı, push atlanıyor"); return; }

        var client = new WebPushClient();
        var details = new VapidDetails(vapid.Subject, vapid.PublicKey, vapid.PrivateKey);
        var json = JsonSerializer.Serialize(new
        {
            title = payload.Title,
            body = payload.Body,
            url = payload.Url,
            tag = payload.Tag,
            icon = payload.Icon
        });

        var dead = new List<PushSubscription>();
        foreach (var s in subs)
        {
            try
            {
                var ws = new WebPushSubscription(s.Endpoint, s.P256dh, s.Auth);
                await client.SendNotificationAsync(ws, json, details);
            }
            catch (WebPushException ex)
            {
                if (ex.StatusCode == HttpStatusCode.NotFound || ex.StatusCode == HttpStatusCode.Gone)
                    dead.Add(s);
                else
                    _log.LogWarning(ex, "Push gönderilemedi: {Endpoint}", s.Endpoint);
            }
            catch (Exception ex) { _log.LogWarning(ex, "Push hatası"); }
        }

        if (dead.Count > 0)
        {
            _db.PushSubscriptions.RemoveRange(dead);
            await _db.SaveChangesAsync(ct);
        }
    }
}
