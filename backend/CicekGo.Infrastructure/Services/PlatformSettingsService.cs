using CicekGo.Application.Platform;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using WebPush;

namespace CicekGo.Infrastructure.Services;

/// <summary>Platform geneli ayarlar (Master DB, anahtar-değer): Google Maps API anahtarı + VAPID anahtarları.</summary>
public class PlatformSettingsService : IPlatformSettingsService
{
    private const string MapsKey = "GoogleMapsApiKey";
    private const string VapidPublic = "WebPush.VapidPublicKey";
    private const string VapidPrivate = "WebPush.VapidPrivateKey";
    private const string VapidSubject = "mailto:admin@cicekgo.net";
    private readonly MasterDbContext _db;
    public PlatformSettingsService(MasterDbContext db) => _db = db;

    private async Task<string?> GetAsync(string key, CancellationToken ct)
        => await _db.PlatformSettings.AsNoTracking().Where(x => x.Key == key).Select(x => x.Value).FirstOrDefaultAsync(ct);

    private async Task SetAsync(string key, string? val, CancellationToken ct)
    {
        var row = await _db.PlatformSettings.FirstOrDefaultAsync(x => x.Key == key, ct);
        if (row is null) { row = new PlatformSetting { Key = key, Value = val }; _db.PlatformSettings.Add(row); }
        else row.Value = val;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<string?> GetVapidPublicKeyAsync(CancellationToken ct = default) => await GetAsync(VapidPublic, ct);

    public async Task<VapidKeys> EnsureVapidAsync(CancellationToken ct = default)
    {
        var pub = await GetAsync(VapidPublic, ct);
        var priv = await GetAsync(VapidPrivate, ct);
        if (string.IsNullOrWhiteSpace(pub) || string.IsNullOrWhiteSpace(priv))
        {
            var keys = VapidHelper.GenerateVapidKeys();
            pub = keys.PublicKey; priv = keys.PrivateKey;
            await SetAsync(VapidPublic, pub, ct);
            await SetAsync(VapidPrivate, priv, ct);
        }
        return new VapidKeys { PublicKey = pub!, PrivateKey = priv!, Subject = VapidSubject };
    }

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
