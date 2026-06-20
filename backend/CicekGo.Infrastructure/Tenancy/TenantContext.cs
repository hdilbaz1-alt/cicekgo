using CicekGo.Application.Abstractions;

namespace CicekGo.Infrastructure.Tenancy;

public class TenantContext : ITenantContext
{
    public int? TenantId { get; private set; }
    public string? DbName { get; private set; }
    public string? ConnectionString { get; private set; }
    public bool IsResolved => TenantId.HasValue && !string.IsNullOrWhiteSpace(ConnectionString);

    public void Set(int tenantId, string dbName, string connectionString)
    {
        TenantId = tenantId;
        DbName = dbName;
        ConnectionString = connectionString;
    }
}
