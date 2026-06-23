using CicekGo.Api.Authorization;
using CicekGo.Application.Abstractions;
using CicekGo.Application.Admin;
using CicekGo.Application.Common;
using CicekGo.Application.Platform;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly ITenantAdminService _tenants;
    private readonly IUserAdminService _users;
    private readonly ICurrentUser _current;
    private readonly IPlatformSettingsService _platform;

    public AdminController(ITenantAdminService tenants, IUserAdminService users, ICurrentUser current, IPlatformSettingsService platform)
    {
        _tenants = tenants;
        _users = users;
        _current = current;
        _platform = platform;
    }

    // ===== Platform geneli ayarlar (Google Maps API anahtarı) — yalnız platform yöneticisi =====

    [HttpGet("platform-settings")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<PlatformSettingsDto>>> GetPlatformSettings(CancellationToken ct)
        => Ok(ApiResponse<PlatformSettingsDto>.Ok(await _platform.GetAsync(ct)));

    [HttpPut("platform-settings")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<PlatformSettingsDto>>> UpdatePlatformSettings([FromBody] PlatformSettingsDto dto, CancellationToken ct)
        => Ok(ApiResponse<PlatformSettingsDto>.Ok(await _platform.UpdateAsync(dto, ct), "Platform ayarları güncellendi."));

    // ===== Platform: firma + DB yönetimi (TenantsManage) =====

    [HttpPost("tenants")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<TenantDto>>> CreateTenant([FromBody] CreateTenantRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<TenantDto>.Ok(await _tenants.CreateTenantAsync(dto, ct), "Firma oluşturuldu.", 201));

    [HttpGet("tenants")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TenantDto>>>> GetTenants(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<TenantDto>>.Ok(await _tenants.GetTenantsAsync(ct)));

    [HttpPut("tenants/{id:int}")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<TenantDto>>> UpdateTenant(int id, [FromBody] UpdateTenantRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<TenantDto>.Ok(await _tenants.UpdateTenantAsync(id, dto, ct), "Firma güncellendi."));

    [HttpDelete("tenants/{id:int}")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteTenant(int id, [FromQuery] bool dropDatabase = false, CancellationToken ct = default)
    {
        await _tenants.DeleteTenantAsync(id, dropDatabase, ct);
        return Ok(ApiResponse<string>.Ok("deleted", dropDatabase ? "Firma ve veritabanı silindi." : "Firma kaydı silindi."));
    }

    [HttpGet("tenants/{tenantId:int}/users")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetTenantUsers(int tenantId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<UserDto>>.Ok(await _users.GetUsersAsync(tenantId, ct)));

    [HttpPost("tenants/{tenantId:int}/users")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateTenantUser(int tenantId, [FromBody] CreateUserRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<UserDto>.Ok(await _users.CreateUserAsync(tenantId, dto, ct), "Kullanıcı oluşturuldu.", 201));

    [HttpGet("tenants/{tenantId:int}/roles")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RoleDto>>>> GetTenantRoles(int tenantId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(await _users.GetRolesAsync(tenantId, ct)));

    [HttpPut("tenants/{tenantId:int}/users/{userId:int}")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateTenantUser(int tenantId, int userId, [FromBody] UpdateUserRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<UserDto>.Ok(await _users.UpdateUserAsync(tenantId, userId, dto, ct), "Kullanıcı güncellendi."));

    [HttpDelete("tenants/{tenantId:int}/users/{userId:int}")]
    [HasPermission(Permissions.TenantsManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteTenantUser(int tenantId, int userId, CancellationToken ct)
    {
        await _users.DeleteUserAsync(tenantId, userId, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Kullanıcı silindi."));
    }

    [HttpGet("permissions")]
    [Authorize]
    public ActionResult<ApiResponse<IReadOnlyList<PermissionDto>>> GetPermissions()
        => Ok(ApiResponse<IReadOnlyList<PermissionDto>>.Ok(_users.GetPermissionCatalog()));

    // Kurye atama için firma kullanıcı listesi (orders.assign_courier yetkisiyle)
    [HttpGet("couriers")]
    [HasPermission(Permissions.OrdersAssignCourier)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> Couriers(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<UserDto>>.Ok(await _users.GetCouriersAsync(CurrentTenantId(), ct)));

    // ===== Firma içi: kullanıcı + rol yönetimi (UsersManage, aktif firma) =====

    [HttpGet("users")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UserDto>>>> GetUsers(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<UserDto>>.Ok(await _users.GetUsersAsync(CurrentTenantId(), ct)));

    [HttpPost("users")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<UserDto>.Ok(await _users.CreateUserAsync(CurrentTenantId(), dto, ct), "Kullanıcı oluşturuldu.", 201));

    [HttpPut("users/{userId:int}")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateUser(int userId, [FromBody] UpdateUserRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<UserDto>.Ok(await _users.UpdateUserAsync(CurrentTenantId(), userId, dto, ct), "Kullanıcı güncellendi."));

    [HttpDelete("users/{userId:int}")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteUser(int userId, CancellationToken ct)
    {
        await _users.DeleteUserAsync(CurrentTenantId(), userId, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Kullanıcı silindi."));
    }

    [HttpGet("roles")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RoleDto>>>> GetRoles(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RoleDto>>.Ok(await _users.GetRolesAsync(CurrentTenantId(), ct)));

    [HttpPost("roles")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<RoleDto>>> CreateRole([FromBody] CreateRoleRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<RoleDto>.Ok(await _users.CreateRoleAsync(CurrentTenantId(), dto, ct), "Rol oluşturuldu.", 201));

    [HttpPut("roles/{roleId:int}")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<RoleDto>>> UpdateRole(int roleId, [FromBody] CreateRoleRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<RoleDto>.Ok(await _users.UpdateRoleAsync(CurrentTenantId(), roleId, dto, ct), "Rol güncellendi."));

    [HttpDelete("roles/{roleId:int}")]
    [HasPermission(Permissions.UsersManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteRole(int roleId, CancellationToken ct)
    {
        await _users.DeleteRoleAsync(CurrentTenantId(), roleId, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Rol silindi."));
    }

    private int CurrentTenantId() =>
        _current.TenantId ?? throw new ForbiddenException("Bu işlem bir firma bağlamı gerektirir.");
}
