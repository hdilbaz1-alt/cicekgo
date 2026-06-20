namespace CicekGo.Application.Abstractions;

public record TenantConnectionInfo(int TenantId, string DbName, string ConnectionString, DateTime? LicenseEndUtc, bool IsActive);

/// <summary>Tenant_id'den firmanın DB bağlantı bilgisini çözer (cache'li).</summary>
public interface ITenantConnectionResolver
{
    Task<TenantConnectionInfo?> ResolveAsync(int tenantId, CancellationToken ct = default);
    void Invalidate(int tenantId);
}
