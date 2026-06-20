using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Tenants.Dtos;

namespace cicekgo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TenantPingController : ControllerBase
{
    private readonly ITenantDbFactory _tenantDb;
    private readonly ITenantContext _tenantContext;
    private readonly ITenantRepository _tenantRepo;

    public TenantPingController(ITenantDbFactory tenantDb, ITenantContext tenantContext, ITenantRepository tenantRepo)
    {
        _tenantDb = tenantDb;
        _tenantContext = tenantContext;
        _tenantRepo = tenantRepo;
    }

    // ESKİ: Lisans geçerliyse db adını döndürür, değilse 403 + "license expired"
    [Authorize]
    [HttpGet("db-name")]
    public async Task<ActionResult<ApiResponse<object>>> GetDbName()
    {
        if (!_tenantContext.TenantId.HasValue)
            return Unauthorized(ApiResponse<object>.Fail("tenant not resolved", 401));

        var info = await _tenantRepo.GetDbNameAndLkEndByIdAsync(_tenantContext.TenantId.Value);
        if (info is null)
            return Unauthorized(ApiResponse<object>.Fail("tenant not found or inactive", 401));

        var (dbName, lkEnd) = info.Value;
        var todayUtc = DateTime.UtcNow.Date;

        if (lkEnd.HasValue && lkEnd.Value.Date < todayUtc)
            return StatusCode(403, ApiResponse<object>.Fail("license expired", 403));

        return Ok(ApiResponse<object>.Ok(new { dbName }));
    }

    // YENİ: front-end için tenant bilgileri (Name, LkStart, LkEnd, IsExpired, DbName?)
    [Authorize]
    [HttpGet("info")]
    public async Task<ActionResult<ApiResponse<TenantInfoDto>>> GetInfo()
    {
        if (!_tenantContext.TenantId.HasValue)
            return Unauthorized(ApiResponse<TenantInfoDto>.Fail("tenant not resolved", 401));

        var data = await _tenantRepo.GetFullInfoAsync(_tenantContext.TenantId.Value);
        if (data is null)
            return Unauthorized(ApiResponse<TenantInfoDto>.Fail("tenant not found or inactive", 401));

        var (name, dbName, lkStart, lkEnd) = data.Value;
        var todayUtc = DateTime.UtcNow.Date;
        var isExpired = lkEnd.HasValue && lkEnd.Value.Date < todayUtc;

        if (isExpired)
            return StatusCode(403, ApiResponse<TenantInfoDto>.Fail("license expired", 403));

        var dto = new TenantInfoDto
        {
            Name = name,
            LkStart = lkStart,
            LkEnd = lkEnd,
            IsExpired = false,
            DbName = dbName
        };

        return Ok(ApiResponse<TenantInfoDto>.Ok(dto));
    }
}
