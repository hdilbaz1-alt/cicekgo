namespace CicekGo.Infrastructure.Configuration;

public class DatabaseOptions
{
    public const string SectionName = "Database";

    /// <summary>Master/Identity DB bağlantısı.</summary>
    public string MasterConnection { get; set; } = default!;

    /// <summary>Tenant DB bağlantı şablonu; {DBNAME} yer tutucusu firma DB adıyla değiştirilir.</summary>
    public string TenantConnectionTemplate { get; set; } = default!;

    /// <summary>Yeni tenant DB'lerinin adı: bu önek + slug (örn. "cicekgo_tenant_").</summary>
    public string TenantDbPrefix { get; set; } = "cicekgo_tenant_";

    public string BuildTenantConnectionString(string dbName) =>
        TenantConnectionTemplate.Replace("{DBNAME}", dbName, StringComparison.OrdinalIgnoreCase);
}
