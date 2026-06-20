using System.Globalization;
using CicekGo.Application.Common;
using CicekGo.Application.Settings;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class StoreSettingsService : IStoreSettingsService
{
    private readonly TenantDbContext _db;
    public StoreSettingsService(TenantDbContext db) => _db = db;

    public async Task<StoreSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var s = await _db.StoreSettings.AsNoTracking().FirstOrDefaultAsync(ct)
                ?? new StoreSettings();
        return ToDto(s);
    }

    public async Task<StoreSettingsDto> UpdateAsync(StoreSettingsUpdateDto dto, CancellationToken ct = default)
    {
        if (!TryParse(dto.OpenTime, out _) || !TryParse(dto.CloseTime, out _))
            throw new AppException("Saat formatı HH:mm olmalı.");
        if (dto.SlotMinutes < 5 || dto.SlotMinutes > 240)
            throw new AppException("Slot süresi 5-240 dakika arası olmalı.");

        var s = await _db.StoreSettings.FirstOrDefaultAsync(ct);
        if (s is null) { s = new StoreSettings(); _db.StoreSettings.Add(s); }
        s.OpenTime = dto.OpenTime;
        s.CloseTime = dto.CloseTime;
        s.SlotMinutes = dto.SlotMinutes;
        await _db.SaveChangesAsync(ct);
        return ToDto(s);
    }

    private static StoreSettingsDto ToDto(StoreSettings s) => new()
    {
        OpenTime = s.OpenTime,
        CloseTime = s.CloseTime,
        SlotMinutes = s.SlotMinutes,
        DeliverySlots = GenerateSlots(s.OpenTime, s.CloseTime, s.SlotMinutes)
    };

    public static List<string> GenerateSlots(string open, string close, int slot)
    {
        var list = new List<string>();
        if (!TryParse(open, out var o) || !TryParse(close, out var c) || slot <= 0) return list;
        for (var t = o; t + slot <= c; t += slot)
            list.Add($"{Fmt(t)} - {Fmt(t + slot)}");
        return list;
    }

    private static bool TryParse(string hhmm, out int minutes)
    {
        minutes = 0;
        if (TimeSpan.TryParseExact(hhmm, @"hh\:mm", CultureInfo.InvariantCulture, out var ts))
        { minutes = (int)ts.TotalMinutes; return true; }
        return false;
    }

    private static string Fmt(int minutes) => $"{minutes / 60:D2}:{minutes % 60:D2}";
}
