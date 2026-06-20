namespace CicekGo.Application.Platform;

public class PlatformSettingsDto
{
    public string? GoogleMapsApiKey { get; set; }
}

public interface IPlatformSettingsService
{
    Task<PlatformSettingsDto> GetAsync(CancellationToken ct = default);
    Task<PlatformSettingsDto> UpdateAsync(PlatformSettingsDto dto, CancellationToken ct = default);
    Task<string?> GetMapsKeyAsync(CancellationToken ct = default);
}
