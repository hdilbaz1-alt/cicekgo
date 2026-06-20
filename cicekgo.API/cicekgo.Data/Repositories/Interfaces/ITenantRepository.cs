namespace cicekgo.Data.Repositories.Interfaces;

public interface ITenantRepository
{
    Task<string?> GetDbNameByIdAsync(int tenantId);
    Task<(string DbName, DateTime? LkEnd)?> GetDbNameAndLkEndByIdAsync(int tenantId);
    Task<(string Name, string DbName, DateTime? LkStart, DateTime? LkEnd)?> GetFullInfoAsync(int tenantId);
}
