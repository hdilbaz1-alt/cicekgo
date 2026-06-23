namespace CicekGo.Domain.Master;

/// <summary>Stateful refresh token (rotation). Ham token istemcide; burada yalnız SHA-256 hash saklanır.</summary>
public class RefreshToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = default!;   // unique (hex sha256)
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? ReplacedByHash { get; set; }         // rotation izi (reuse-detection)
    public string? UserAgent { get; set; }

    public bool IsActive => RevokedAtUtc == null && DateTime.UtcNow < ExpiresAtUtc;
}
