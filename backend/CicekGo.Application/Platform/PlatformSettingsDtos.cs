namespace CicekGo.Application.Platform;

public class PlatformSettingsDto
{
    public string? GoogleMapsApiKey { get; set; }
}

public class VapidKeys
{
    public string PublicKey { get; set; } = default!;
    public string PrivateKey { get; set; } = default!;
    public string Subject { get; set; } = "mailto:admin@cicekgo.net";
}

public interface IPlatformSettingsService
{
    Task<PlatformSettingsDto> GetAsync(CancellationToken ct = default);
    Task<PlatformSettingsDto> UpdateAsync(PlatformSettingsDto dto, CancellationToken ct = default);
    Task<string?> GetMapsKeyAsync(CancellationToken ct = default);

    /// <summary>VAPID anahtarlarını döndürür; yoksa üretip kaydeder (idempotent).</summary>
    Task<VapidKeys> EnsureVapidAsync(CancellationToken ct = default);
    Task<string?> GetVapidPublicKeyAsync(CancellationToken ct = default);
}
