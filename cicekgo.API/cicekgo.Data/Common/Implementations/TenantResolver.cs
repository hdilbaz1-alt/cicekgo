using System.Security.Claims;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;

namespace cicekgo.Data.Common.Implementations;

public class TenantResolver : ITenantResolver
{
    private readonly IHttpContextAccessor _http;
    private readonly ITenantRepository _tenantRepo;
    private readonly ITenantContext _tenantContext;
    private readonly IMemoryCache _cache;

    public TenantResolver(IHttpContextAccessor http, ITenantRepository tenantRepo, ITenantContext tenantContext, IMemoryCache cache)
    {
        _http = http;
        _tenantRepo = tenantRepo;
        _tenantContext = tenantContext;
        _cache = cache;
    }

    public async Task ResolveAsync()
    {
        var ctx = _http.HttpContext;
        if (ctx is null) return;

        // Zaten set edilmişse tekrar çözme
        if (_tenantContext.TenantId.HasValue && !string.IsNullOrWhiteSpace(_tenantContext.DbName))
            return;

        var user = ctx.User;
        if (user?.Identity is null || !user.Identity.IsAuthenticated) return;

        var tenantIdStr = user.FindFirst("tenant_id")?.Value;
        if (!int.TryParse(tenantIdStr, out var tenantId)) return;

        // DbName'i cache'ten al (1-5 dk arası tutmak yeterli)
        var cacheKey = $"tenant_dbname_{tenantId}";
        if (!_cache.TryGetValue(cacheKey, out string? dbName) || string.IsNullOrWhiteSpace(dbName))
        {
            dbName = await _tenantRepo.GetDbNameByIdAsync(tenantId);
            if (string.IsNullOrWhiteSpace(dbName))
                throw new UnauthorizedAccessException("Tenant aktif değil veya bulunamadı.");

            _cache.Set(cacheKey, dbName, TimeSpan.FromMinutes(3));
        }

        _tenantContext.Set(tenantId, dbName);
    }
}
