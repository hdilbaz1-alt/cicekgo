using CicekGo.Application.Admin;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;

namespace CicekGo.Infrastructure.Provisioning;

/// <summary>
/// Yeni firma DB'sini fiziksel olarak yaratır (CREATE DATABASE), şemayı migrate eder
/// ve varsayılan kayıtları seed eder.
/// </summary>
public class TenantProvisioner : ITenantProvisioner
{
    private readonly DatabaseOptions _dbOptions;

    public TenantProvisioner(IOptions<DatabaseOptions> dbOptions) => _dbOptions = dbOptions.Value;

    public async Task ProvisionAsync(string dbName, CancellationToken ct = default)
    {
        await CreateDatabaseIfNotExistsAsync(dbName, ct);

        var tenantCs = _dbOptions.BuildTenantConnectionString(dbName);
        var options = new DbContextOptionsBuilder<TenantDbContext>()
            .UseNpgsql(tenantCs)
            .UseSnakeCaseNamingConvention()
            .Options;

        await using var ctx = new TenantDbContext(options);
        await ctx.Database.MigrateAsync(ct);
        await SeedDefaultsAsync(ctx, ct);
    }

    public async Task DeprovisionAsync(string dbName, CancellationToken ct = default)
    {
        var adminCs = BuildMaintenanceConnectionString();
        await using var conn = new NpgsqlConnection(adminCs);
        await conn.OpenAsync(ct);

        // Açık bağlantıları sonlandır, sonra DB'yi düşür.
        await using (var terminate = conn.CreateCommand())
        {
            terminate.CommandText =
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = @name AND pid <> pg_backend_pid()";
            terminate.Parameters.AddWithValue("name", dbName);
            await terminate.ExecuteNonQueryAsync(ct);
        }

        await using var drop = conn.CreateCommand();
        drop.CommandText = $"DROP DATABASE IF EXISTS \"{dbName}\"";
        await drop.ExecuteNonQueryAsync(ct);
    }

    private async Task CreateDatabaseIfNotExistsAsync(string dbName, CancellationToken ct)
    {
        // Master bağlantısı üzerinden "postgres" bakım veritabanına bağlanıp CREATE DATABASE çalıştır.
        var adminCs = BuildMaintenanceConnectionString();
        await using var conn = new NpgsqlConnection(adminCs);
        await conn.OpenAsync(ct);

        await using (var check = conn.CreateCommand())
        {
            check.CommandText = "SELECT 1 FROM pg_database WHERE datname = @name";
            check.Parameters.AddWithValue("name", dbName);
            var exists = await check.ExecuteScalarAsync(ct);
            if (exists is not null) return;
        }

        await using var create = conn.CreateCommand();
        // dbName uygulama tarafında doğrulanır (a-z0-9_), yine de identifier'ı tırnakla.
        create.CommandText = $"CREATE DATABASE \"{dbName}\"";
        await create.ExecuteNonQueryAsync(ct);
    }

    private string BuildMaintenanceConnectionString()
    {
        // Tenant template'inden bağlantı bilgilerini al, veritabanını "postgres" yap.
        var sample = _dbOptions.BuildTenantConnectionString("postgres");
        var builder = new NpgsqlConnectionStringBuilder(sample) { Database = "postgres" };
        return builder.ConnectionString;
    }

    private static async Task SeedDefaultsAsync(TenantDbContext ctx, CancellationToken ct)
    {
        if (!await ctx.OrderStatuses.AnyAsync(ct))
        {
            ctx.OrderStatuses.AddRange(
                new OrderStatus { Name = "Beklemede", SortOrder = 1 },
                new OrderStatus { Name = "Onaylandı", SortOrder = 2 },
                new OrderStatus { Name = "Hazırlanıyor", SortOrder = 3 },
                new OrderStatus { Name = "Teslimatta", SortOrder = 4 },
                new OrderStatus { Name = "Teslim Edildi", SortOrder = 5 },
                new OrderStatus { Name = "İptal Edildi", SortOrder = 6 });
        }

        if (!await ctx.PaymentMethods.AnyAsync(ct))
        {
            ctx.PaymentMethods.AddRange(
                new PaymentMethod { Name = "Nakit", IsDefault = true, SortOrder = 1 },
                new PaymentMethod { Name = "Kredi Kartı", SortOrder = 2 },
                new PaymentMethod { Name = "Havale/EFT", SortOrder = 3 },
                new PaymentMethod { Name = "Diğer", SortOrder = 4 });
        }

        if (!await ctx.ProductTypes.AnyAsync(ct))
        {
            ctx.ProductTypes.AddRange(
                new ProductType { Name = "Buket" },
                new ProductType { Name = "Aranjman" },
                new ProductType { Name = "Vazo" });
        }

        if (!await ctx.OrderCodeSequences.AnyAsync(ct))
        {
            ctx.OrderCodeSequences.Add(new OrderCodeSequence { Prefix = "SIP", NextNumber = 1 });
        }

        if (!await ctx.Units.AnyAsync(ct))
        {
            ctx.Units.AddRange(DefaultUnits());
        }

        if (!await ctx.StoreSettings.AnyAsync(ct))
        {
            ctx.StoreSettings.Add(new StoreSettings());
        }

        if (!await ctx.PrintTemplates.AnyAsync(ct))
        {
            ctx.PrintTemplates.Add(new PrintTemplate { Name = "Varsayılan Şablon", IsDefault = true, CreatedAt = DateTime.UtcNow });
        }

        await ctx.SaveChangesAsync(ct);
    }

    public static IEnumerable<Unit> DefaultUnits()
    {
        var names = new[] { "Adet", "Demet", "Buket", "Kutu", "Paket", "Dal", "Saksı", "Kg", "Gram", "Metre" };
        return names.Select((n, i) => new Unit { Name = n, SortOrder = i + 1, IsActive = true });
    }
}
