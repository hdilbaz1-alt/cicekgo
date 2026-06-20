using Dapper;
using cicekgo.Core.Auth.Dtos;            // RoleItemDto
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Interfaces;
using cicekgo.Domain.Entities;

namespace cicekgo.Data.Repositories.Implementations
{
    public class UserAuthRepository : IUserAuthRepository
    {
        private readonly IIdentityDbFactory _identityDbFactory;

        public UserAuthRepository(IIdentityDbFactory identityDbFactory)
        {
            _identityDbFactory = identityDbFactory;
        }

        public async Task<AppUser?> GetByUserNameAsync(string userName)
        {
            const string sql = @"
SELECT TOP(1) Id, UserName, Email, PasswordHash, PasswordSalt, IsActive, CreatedAt, LastLoginAt
FROM dbo.AppUser WITH (NOLOCK)
WHERE UserName = @UserName;";
            using var conn = _identityDbFactory.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<AppUser>(sql, new { UserName = userName });
        }

        public async Task<int?> GetUserDefaultTenantIdAsync(int userId)
        {
            const string sql = @"
;WITH pref AS (
    SELECT TOP(1) ut.TenantId
    FROM dbo.UserTenant ut WITH (NOLOCK)
    INNER JOIN dbo.Tenant t WITH (NOLOCK) ON t.Id = ut.TenantId AND t.IsActive = 1
    WHERE ut.UserId = @UserId AND ut.IsDefault = 1
    ORDER BY ut.Id ASC
),
fallback AS (
    SELECT TOP(1) ut.TenantId
    FROM dbo.UserTenant ut WITH (NOLOCK)
    INNER JOIN dbo.Tenant t WITH (NOLOCK) ON t.Id = ut.TenantId AND t.IsActive = 1
    WHERE ut.UserId = @UserId
    ORDER BY ut.Id ASC
)
SELECT TenantId FROM pref
UNION ALL
SELECT TenantId FROM fallback
WHERE NOT EXISTS (SELECT 1 FROM pref);";

            using var conn = _identityDbFactory.CreateConnection();
            return await conn.ExecuteScalarAsync<int?>(sql, new { UserId = userId });
        }

        // ==== YENİ: ID + Name dönen roller
        public async Task<IEnumerable<RoleItemDto>> GetUserRolesDetailedAsync(int userId)
        {
            const string sql = @"
SELECT r.Id, r.Name
FROM dbo.UserRole ur WITH (NOLOCK)
JOIN dbo.Role r WITH (NOLOCK) ON r.Id = ur.RoleId
WHERE ur.UserId = @UserId
ORDER BY r.Id;";
            using var conn = _identityDbFactory.CreateConnection();
            return await conn.QueryAsync<RoleItemDto>(sql, new { UserId = userId });
        }

        // ==== YENİ: ID + Name dönen special roles
        public async Task<IEnumerable<RoleItemDto>> GetUserSpecialRolesDetailedAsync(int userId)
        {
            const string sql = @"
SELECT sr.Id, sr.Name
FROM dbo.UserSpecialRole usr WITH (NOLOCK)
JOIN dbo.SpecialRole sr WITH (NOLOCK) ON sr.Id = usr.SpecialRoleId
WHERE usr.UserId = @UserId
ORDER BY sr.Id;";
            using var conn = _identityDbFactory.CreateConnection();
            return await conn.QueryAsync<RoleItemDto>(sql, new { UserId = userId });
        }

        // (Opsiyonel) Geriye dönük uyum için: sadece isim dönen eski metotlar
        public async Task<IEnumerable<string>> GetUserRolesAsync(int userId)
        {
            var detailed = await GetUserRolesDetailedAsync(userId);
            return detailed.Select(x => x.Name);
        }

        public async Task<IEnumerable<string>> GetUserSpecialRolesAsync(int userId)
        {
            var detailed = await GetUserSpecialRolesDetailedAsync(userId);
            return detailed.Select(x => x.Name);
        }

        public async Task UpdateLastLoginAsync(int userId, DateTime when)
        {
            const string sql = @"UPDATE dbo.AppUser SET LastLoginAt = @When WHERE Id = @UserId;";
            using var conn = _identityDbFactory.CreateConnection();
            await conn.ExecuteAsync(sql, new { UserId = userId, When = when });
        }
    }
}
