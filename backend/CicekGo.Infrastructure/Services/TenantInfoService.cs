using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Tenants;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class TenantInfoService : ITenantInfoService
{
    private readonly MasterDbContext _master;
    private readonly ICurrentUser _current;

    public TenantInfoService(MasterDbContext master, ICurrentUser current)
    {
        _master = master;
        _current = current;
    }

    public async Task<TenantInfoDto> GetCurrentAsync(CancellationToken ct = default)
    {
        var tenantId = _current.TenantId ?? throw new UnauthorizedException("tenant not resolved");

        var t = await _master.Tenants.AsNoTracking().FirstOrDefaultAsync(x => x.Id == tenantId, ct);
        if (t is null || !t.IsActive)
            throw new UnauthorizedException("tenant not found or inactive");

        var isExpired = t.LicenseEndUtc.HasValue && t.LicenseEndUtc.Value.Date < DateTime.UtcNow.Date;
        if (isExpired)
            throw new ForbiddenException("license expired");

        return new TenantInfoDto
        {
            Name = t.Name,
            LkStart = t.LicenseStartUtc,
            LkEnd = t.LicenseEndUtc,
            IsExpired = false,
            DbName = t.DbName,
            LogoBase64 = t.LogoBase64,
            LogoRemoveBg = t.LogoRemoveBg
        };
    }
}
