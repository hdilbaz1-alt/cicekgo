using cicekgo.Data.Common.Interfaces;

namespace cicekgo.Data.Common.Implementations;

public class TenantContext : ITenantContext
{
    public int? TenantId { get; private set; }
    public string? DbName { get; private set; }

    public void Set(int tenantId, string dbName)
    {
        TenantId = tenantId;
        DbName = dbName;
    }
}
