namespace cicekgo.Data.Common.Interfaces;

public interface ITenantContext
{
    int? TenantId { get; }
    string? DbName { get; }
    void Set(int tenantId, string dbName);
}
