namespace CicekGo.Application.Admin;

/// <summary>Platform/super-admin: firma + DB yönetimi.</summary>
public interface ITenantAdminService
{
    Task<TenantDto> CreateTenantAsync(CreateTenantRequestDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<TenantDto>> GetTenantsAsync(CancellationToken ct = default);
    Task<TenantDto> UpdateTenantAsync(int id, UpdateTenantRequestDto dto, CancellationToken ct = default);
    Task DeleteTenantAsync(int id, bool dropDatabase, CancellationToken ct = default);
}

/// <summary>Firma içi kullanıcı + rol yönetimi (tenant admin) ve platform kullanıcıları.</summary>
public interface IUserAdminService
{
    Task<UserDto> CreateUserAsync(int tenantId, CreateUserRequestDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<UserDto>> GetUsersAsync(int tenantId, CancellationToken ct = default);
    Task<UserDto> UpdateUserAsync(int tenantId, int userId, UpdateUserRequestDto dto, CancellationToken ct = default);
    Task DeleteUserAsync(int tenantId, int userId, CancellationToken ct = default);

    Task<IReadOnlyList<RoleDto>> GetRolesAsync(int tenantId, CancellationToken ct = default);
    Task<RoleDto> CreateRoleAsync(int tenantId, CreateRoleRequestDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<UserDto>> GetCouriersAsync(int tenantId, CancellationToken ct = default);
    IReadOnlyList<PermissionDto> GetPermissionCatalog();
}

/// <summary>Yeni firma DB'sini fiziksel olarak yaratır, şemayı migrate eder ve seed eder.</summary>
public interface ITenantProvisioner
{
    Task ProvisionAsync(string dbName, CancellationToken ct = default);
    Task DeprovisionAsync(string dbName, CancellationToken ct = default);
}
