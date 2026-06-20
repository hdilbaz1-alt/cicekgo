namespace CicekGo.Application.Abstractions;

/// <summary>İstek başına çözülen aktif firma (tenant) ve bağlantı bilgisi.</summary>
public interface ITenantContext
{
    int? TenantId { get; }
    string? DbName { get; }
    string? ConnectionString { get; }
    bool IsResolved { get; }

    void Set(int tenantId, string dbName, string connectionString);
}
