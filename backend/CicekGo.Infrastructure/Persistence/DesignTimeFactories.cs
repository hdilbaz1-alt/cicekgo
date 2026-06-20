using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CicekGo.Infrastructure.Persistence;

/// <summary>
/// Design-time factory'ler: `dotnet ef migrations add` için. Burada verilen connection string
/// yalnızca model üretimi içindir, gerçek bağlantı kurulmaz.
/// </summary>
public class MasterDbContextFactory : IDesignTimeDbContextFactory<MasterDbContext>
{
    public MasterDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<MasterDbContext>()
            .UseNpgsql("Host=localhost;Database=cicekgo_master;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;
        return new MasterDbContext(options);
    }
}

public class TenantDbContextFactory : IDesignTimeDbContextFactory<TenantDbContext>
{
    public TenantDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TenantDbContext>()
            .UseNpgsql("Host=localhost;Database=cicekgo_tenant_template;Username=postgres;Password=postgres")
            .UseSnakeCaseNamingConvention()
            .Options;
        return new TenantDbContext(options);
    }
}
