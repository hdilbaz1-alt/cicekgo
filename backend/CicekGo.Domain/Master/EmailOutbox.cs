namespace CicekGo.Domain.Master;

/// <summary>Merkezî e-posta kuyruğu (outbox). Worker bunu drenajla gönderir. Render edilmiş (hazır) içerik taşır.</summary>
public class EmailOutbox
{
    public long Id { get; set; }
    public int TenantId { get; set; }
    public int OrderId { get; set; }
    public string OrderCode { get; set; } = default!;
    public string Audience { get; set; } = "recipient";   // recipient | sender
    public string ToEmail { get; set; } = default!;
    public string Subject { get; set; } = default!;        // render edilmiş
    public string HtmlBody { get; set; } = default!;       // render edilmiş
    public string Status { get; set; } = "Pending";        // Pending | Sending | Sent | Failed | Dead
    public int AttemptCount { get; set; }
    public int MaxAttempts { get; set; } = 5;
    public DateTime NextAttemptUtc { get; set; }
    public string? LastError { get; set; }
    public string DedupKey { get; set; } = default!;       // idempotency
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }
}
