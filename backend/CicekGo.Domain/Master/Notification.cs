namespace CicekGo.Domain.Master;

/// <summary>Kullanıcıya gelen kalıcı bildirim (zil ikonu listesi). Web-push gönderiminde de kaydedilir.</summary>
public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? TenantId { get; set; }
    public string Title { get; set; } = default!;
    public string Body { get; set; } = default!;
    public string? Url { get; set; }
    public string? Type { get; set; }            // örn. "order", "broadcast", "system"
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? ReadAtUtc { get; set; }
}
