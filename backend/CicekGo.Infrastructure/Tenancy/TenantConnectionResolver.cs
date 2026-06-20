using CicekGo.Application.Abstractions;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace CicekGo.Infrastructure.Tenancy;

/// <summary>Master DB'den tenant bağlantı bilgisini çözer ve 3 dk cache'ler.</summary>
public class TenantConnectionResolver : ITenantConnectionResolver
{
    private readonly MasterDbContext _master;
    private readonly IMemoryCache _cache;
    private readonly DatabaseOptions _dbOptions;

    public TenantConnectionResolver(MasterDbContext master, IMemoryCache cache, IOptions<DatabaseOptions> dbOptions)
    {
        _master = master;
        _cache = cache;
        _dbOptions = dbOptions.Value;
    }

    private static string CacheKey(int tenantId) => $"tenant_conn_{tenantId}";

    public async Task<TenantConnectionInfo?> ResolveAsync(int tenantId, CancellationToken ct = default)
    {
        if (_cache.TryGetValue(CacheKey(tenantId), out TenantConnectionInfo? cached) && cached is not null)
            return cached;

        var t = await _master.Tenants.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == tenantId, ct);
        if (t is null) return null;

        var cs = _dbOptions.BuildTenantConnectionString(t.DbName);
        var info = new TenantConnectionInfo(t.Id, t.DbName, cs, t.LicenseEndUtc, t.IsActive);

        _cache.Set(CacheKey(tenantId), info, TimeSpan.FromMinutes(3));
        return info;
    }

    public void Invalidate(int tenantId) => _cache.Remove(CacheKey(tenantId));
}
