namespace CicekGo.Application.Notifications;

/// <summary>Tarayıcıdan gelen push aboneliği (PushSubscription.toJSON()).</summary>
public class PushSubscribeDto
{
    public string Endpoint { get; set; } = default!;
    public string P256dh { get; set; } = default!;
    public string Auth { get; set; } = default!;
    public string? UserAgent { get; set; }
}

/// <summary>Cihaza gönderilecek bildirim içeriği (SW push event'inde gösterilir).</summary>
public class NotificationPayload
{
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;
    public string? Url { get; set; }
    public string? Tag { get; set; }
    public string? Icon { get; set; }
}

/// <summary>Toplu yayın isteği. Scope: "tenant" | "all". Süperadmin değilse tenant'a zorlanır.</summary>
public class BroadcastDto
{
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;
    public string? Url { get; set; }
    public string Scope { get; set; } = "tenant";   // "tenant" | "all"
    public int? TenantId { get; set; }               // süperadmin belirli firmaya gönderirse
}

public interface IPushSubscriptionService
{
    Task SaveAsync(int userId, int? tenantId, PushSubscribeDto dto, CancellationToken ct = default);
    Task DeleteAsync(string endpoint, CancellationToken ct = default);
}

public interface IPushNotificationService
{
    /// <summary>Tek kullanıcıya (tüm cihazlarına) gönderir. Hata fırlatmaz (loglar).</summary>
    Task SendToUserAsync(int userId, NotificationPayload payload, CancellationToken ct = default);

    /// <summary>Toplu yayın. callerTenantId/isPlatformAdmin ile kapsam zorlanır. Gönderilen abonelik sayısını döndürür.</summary>
    Task<int> BroadcastAsync(BroadcastDto dto, int? callerTenantId, bool isPlatformAdmin, CancellationToken ct = default);
}
