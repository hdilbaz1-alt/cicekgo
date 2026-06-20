using Dapper;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Data.Repositories.Implementations;

public class TenantRepository : ITenantRepository
{
    private readonly IIdentityDbFactory _identityDbFactory;
    public TenantRepository(IIdentityDbFactory identityDbFactory) => _identityDbFactory = identityDbFactory;

    public async Task<string?> GetDbNameByIdAsync(int tenantId)
    {
        const string sql = @"SELECT TOP(1) DbName FROM dbo.Tenant WITH (NOLOCK) WHERE Id = @TenantId AND IsActive = 1;";
        using var conn = _identityDbFactory.CreateConnection();
        return await conn.ExecuteScalarAsync<string?>(sql, new { TenantId = tenantId });
    }

    public async Task<(string DbName, DateTime? LkEnd)?> GetDbNameAndLkEndByIdAsync(int tenantId)
    {
        const string sql = @"
SELECT TOP(1) DbName, LkEnd
FROM dbo.Tenant WITH (NOLOCK)
WHERE Id = @TenantId AND IsActive = 1;";
        using var conn = _identityDbFactory.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync(sql, new { TenantId = tenantId });
        if (row is null) return null;
        string db = row.DbName;
        DateTime? lkEnd = row.LkEnd as DateTime?;
        return (db, lkEnd);
    }

    public async Task<(string Name, string DbName, DateTime? LkStart, DateTime? LkEnd)?> GetFullInfoAsync(int tenantId)
    {
        const string sql = @"
SELECT TOP(1) Name, DbName, LkStart, LkEnd
FROM dbo.Tenant WITH (NOLOCK)
WHERE Id = @TenantId AND IsActive = 1;";
        using var conn = _identityDbFactory.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync(sql, new { TenantId = tenantId });
        if (row is null) return null;

        string name = row.Name;
        string dbName = row.DbName;
        DateTime? lkStart = row.LkStart as DateTime?;
        DateTime? lkEnd = row.LkEnd as DateTime?;
        return (name, dbName, lkStart, lkEnd);
    }
}
