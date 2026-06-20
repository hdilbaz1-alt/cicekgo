using CicekGo.Application.Platform;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

/// <summary>Platform geneli ayarlar (Master DB, anahtar-değer). Şimdilik Google Maps API anahtarı.</summary>
public class PlatformSettingsService : IPlatformSettingsService
{
    private const string MapsKey = "GoogleMapsApiKey";
    private readonly MasterDbContext _db;
    public PlatformSettingsService(MasterDbContext db) => _db = db;

    public async Task<PlatformSettingsDto> GetAsync(CancellationToken ct = default)
        => new() { GoogleMapsApiKey = await GetMapsKeyAsync(ct) };

    public async Task<string?> GetMapsKeyAsync(CancellationToken ct = default)
        => await _db.PlatformSettings.AsNoTracking().Where(x => x.Key == MapsKey).Select(x => x.Value).FirstOrDefaultAsync(ct);

    public async Task<PlatformSettingsDto> UpdateAsync(PlatformSettingsDto dto, CancellationToken ct = default)
    {
        var val = string.IsNullOrWhiteSpace(dto.GoogleMapsApiKey) ? null : dto.GoogleMapsApiKey.Trim();
        var row = await _db.PlatformSettings.FirstOrDefaultAsync(x => x.Key == MapsKey, ct);
        if (row is null) { row = new PlatformSetting { Key = MapsKey, Value = val }; _db.PlatformSettings.Add(row); }
        else row.Value = val;
        await _db.SaveChangesAsync(ct);
        return new PlatformSettingsDto { GoogleMapsApiKey = val };
    }
}
