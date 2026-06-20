using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CicekGo.Infrastructure.Provisioning;

/// <summary>Açılışta mevcut tüm firma DB'lerine bekleyen migration'ları uygular.</summary>
public class TenantMigrator
{
    private readonly MasterDbContext _master;
    private readonly DatabaseOptions _dbOptions;
    private readonly ILogger<TenantMigrator> _logger;

    public TenantMigrator(MasterDbContext master, IOptions<DatabaseOptions> dbOptions, ILogger<TenantMigrator> logger)
    {
        _master = master;
        _dbOptions = dbOptions.Value;
        _logger = logger;
    }

    public async Task MigrateAllAsync(CancellationToken ct = default)
    {
        var tenants = await _master.Tenants.AsNoTracking().ToListAsync(ct);
        foreach (var t in tenants)
        {
            try
            {
                var cs = _dbOptions.BuildTenantConnectionString(t.DbName);
                var options = new DbContextOptionsBuilder<TenantDbContext>()
                    .UseNpgsql(cs).UseSnakeCaseNamingConvention().Options;
                await using var ctx = new TenantDbContext(options);
                await ctx.Database.MigrateAsync(ct);

                // Mevcut firmalarda eksik varsayılan birimleri seed et
                if (!await ctx.Units.AnyAsync(ct))
                {
                    ctx.Units.AddRange(TenantProvisioner.DefaultUnits());
                    await ctx.SaveChangesAsync(ct);
                }
                if (!await ctx.StoreSettings.AnyAsync(ct))
                {
                    ctx.StoreSettings.Add(new CicekGo.Domain.Tenant.StoreSettings());
                    await ctx.SaveChangesAsync(ct);
                }
                if (!await ctx.PrintTemplates.AnyAsync(ct))
                {
                    ctx.PrintTemplates.Add(new CicekGo.Domain.Tenant.PrintTemplate { Name = "Varsayılan Şablon", IsDefault = true, CreatedAt = DateTime.UtcNow });
                    await ctx.SaveChangesAsync(ct);
                }

                _logger.LogInformation("Tenant migrate OK: {Db}", t.DbName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tenant migrate FAILED: {Db}", t.DbName);
            }
        }
    }
}
