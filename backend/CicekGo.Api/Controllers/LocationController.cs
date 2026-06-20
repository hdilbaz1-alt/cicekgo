using CicekGo.Application.Common;
using CicekGo.Application.Location;
using CicekGo.Application.Platform;
using CicekGo.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Api.Controllers;

/// <summary>Türkiye il/ilçe referans verisi (paylaşımlı, Master DB). Form dropdown'ları için.</summary>
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class LocationController : ControllerBase
{
    private readonly MasterDbContext _master;
    private readonly IPlatformSettingsService _platform;
    public LocationController(MasterDbContext master, IPlatformSettingsService platform) { _master = master; _platform = platform; }

    /// <summary>Platform geneli Google Maps API anahtarı (harita konum seçici için, tüm firma kullanıcıları).</summary>
    [HttpGet("maps-key")]
    public async Task<ActionResult<ApiResponse<string?>>> MapsKey(CancellationToken ct)
        => Ok(ApiResponse<string?>.Ok(await _platform.GetMapsKeyAsync(ct)));

    [HttpGet("provinces")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProvinceDto>>>> Provinces(CancellationToken ct)
    {
        var list = await _master.Provinces.AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new ProvinceDto { Id = p.Id, PlateCode = p.PlateCode, Name = p.Name })
            .ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<ProvinceDto>>.Ok(list));
    }

    [HttpGet("districts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DistrictDto>>>> Districts([FromQuery] int provinceId, CancellationToken ct)
    {
        var list = await _master.Districts.AsNoTracking()
            .Where(d => d.ProvinceId == provinceId)
            .OrderBy(d => d.Name)
            .Select(d => new DistrictDto { Id = d.Id, ProvinceId = d.ProvinceId, Name = d.Name })
            .ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<DistrictDto>>.Ok(list));
    }
}
