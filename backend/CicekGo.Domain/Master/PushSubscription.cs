namespace CicekGo.Domain.Master;

/// <summary>Web Push aboneliği (tarayıcı). UserId = master kullanıcı (kurye/admin); TenantId segment/yayın kapsamı için.</summary>
public class PushSubscription
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? TenantId { get; set; }

    public string Endpoint { get; set; } = default!;   // unique
    public string P256dh { get; set; } = default!;
    public string Auth { get; set; } = default!;

    public string? UserAgent { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime LastSeenUtc { get; set; }
}
