using cicekgo.Core.Auth.Dtos;
using cicekgo.Domain.Entities;

namespace cicekgo.Data.Repositories.Interfaces;

public interface IUserAuthRepository
{
    Task<AppUser?> GetByUserNameAsync(string userName);
    Task<int?> GetUserDefaultTenantIdAsync(int userId);
    //Task<IEnumerable<string>> GetUserRolesAsync(int userId);
    //Task<IEnumerable<string>> GetUserSpecialRolesAsync(int userId);

    Task<IEnumerable<RoleItemDto>> GetUserRolesDetailedAsync(int userId);
    Task<IEnumerable<RoleItemDto>> GetUserSpecialRolesDetailedAsync(int userId);

    Task UpdateLastLoginAsync(int userId, DateTime when);
}
