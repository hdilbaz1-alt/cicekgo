using CicekGo.Application.Abstractions;
using CicekGo.Application.Admin;
using CicekGo.Application.Common;
using CicekGo.Domain.Authorization;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class UserAdminService : IUserAdminService
{
    private readonly MasterDbContext _master;
    private readonly IPasswordHasher _hasher;

    public UserAdminService(MasterDbContext master, IPasswordHasher hasher)
    {
        _master = master;
        _hasher = hasher;
    }

    private static string? JoinCsv(IEnumerable<string>? items)
    {
        if (items is null) return null;
        var arr = items.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).Distinct().ToArray();
        return arr.Length == 0 ? null : string.Join(',', arr);
    }
    private static List<string> SplitCsv(string? s) =>
        string.IsNullOrWhiteSpace(s) ? new List<string>() : s.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

    public async Task<UserDto> CreateUserAsync(int tenantId, CreateUserRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Username)) throw new AppException("Kullanıcı adı zorunludur.");
        if (string.IsNullOrWhiteSpace(dto.Password)) throw new AppException("Şifre zorunludur.");

        if (await _master.Users.AnyAsync(u => u.Username == dto.Username, ct))
            throw new ConflictException("Bu kullanıcı adı zaten kullanımda.");

        // Roller bu firmaya ait olmalı
        var roleIds = dto.RoleIds.Distinct().ToArray();
        var validRoles = await _master.Roles
            .Where(r => r.TenantId == tenantId && roleIds.Contains(r.Id))
            .ToListAsync(ct);

        if (validRoles.Count != roleIds.Length)
            throw new AppException("Geçersiz rol(ler) seçildi.");

        var user = new User
        {
            TenantId = tenantId,
            Username = dto.Username.Trim(),
            Email = dto.Email,
            FullName = string.IsNullOrWhiteSpace(dto.FullName) ? dto.Username.Trim() : dto.FullName!.Trim(),
            PasswordHash = _hasher.Hash(dto.Password),
            IsActive = true,
            IsPlatformAdmin = false,
            ExtraPermissions = JoinCsv(dto.ExtraPermissions),
            RevokedPermissions = JoinCsv(dto.RevokedPermissions),
            CreatedAtUtc = DateTime.UtcNow
        };
        _master.Users.Add(user);
        await _master.SaveChangesAsync(ct);

        foreach (var r in validRoles)
            _master.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = r.Id });
        await _master.SaveChangesAsync(ct);

        return (await GetUsersAsync(tenantId, ct)).First(u => u.Id == user.Id);
    }

    public async Task<IReadOnlyList<UserDto>> GetUsersAsync(int tenantId, CancellationToken ct = default)
    {
        var rows = await _master.Users.AsNoTracking()
            .Where(u => u.TenantId == tenantId)
            .OrderBy(u => u.Username)
            .Select(u => new
            {
                u.Id, u.TenantId, u.Username, u.Email, u.FullName, u.IsActive, u.IsPlatformAdmin,
                u.ExtraPermissions, u.RevokedPermissions,
                Roles = u.UserRoles.Select(ur => new RoleDto
                {
                    Id = ur.Role.Id,
                    Name = ur.Role.Name,
                    Description = ur.Role.Description,
                    IsSystem = ur.Role.IsSystem,
                    Permissions = ur.Role.RolePermissions.Select(rp => rp.Permission.Code).ToList()
                }).ToList()
            })
            .ToListAsync(ct);

        return rows.Select(u => new UserDto
        {
            Id = u.Id, TenantId = u.TenantId, Username = u.Username, Email = u.Email, FullName = u.FullName,
            IsActive = u.IsActive, IsPlatformAdmin = u.IsPlatformAdmin, Roles = u.Roles,
            ExtraPermissions = SplitCsv(u.ExtraPermissions),
            RevokedPermissions = SplitCsv(u.RevokedPermissions),
        }).ToList();
    }

    public async Task<UserDto> UpdateUserAsync(int tenantId, int userId, UpdateUserRequestDto dto, CancellationToken ct = default)
    {
        var user = await _master.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId, ct)
            ?? throw new NotFoundException("user not found");

        if (dto.FullName is not null) user.FullName = dto.FullName;
        if (dto.Email is not null) user.Email = dto.Email;
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        if (!string.IsNullOrWhiteSpace(dto.NewPassword)) user.PasswordHash = _hasher.Hash(dto.NewPassword);
        if (dto.ExtraPermissions is not null) user.ExtraPermissions = JoinCsv(dto.ExtraPermissions);
        if (dto.RevokedPermissions is not null) user.RevokedPermissions = JoinCsv(dto.RevokedPermissions);

        if (dto.RoleIds is not null)
        {
            var roleIds = dto.RoleIds.Distinct().ToArray();
            var validCount = await _master.Roles.CountAsync(r => r.TenantId == tenantId && roleIds.Contains(r.Id), ct);
            if (validCount != roleIds.Length) throw new AppException("Geçersiz rol(ler) seçildi.");

            _master.UserRoles.RemoveRange(user.UserRoles);
            await _master.SaveChangesAsync(ct);
            foreach (var rid in roleIds)
                _master.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = rid });
        }

        await _master.SaveChangesAsync(ct);
        return (await GetUsersAsync(tenantId, ct)).First(u => u.Id == userId);
    }

    public async Task DeleteUserAsync(int tenantId, int userId, CancellationToken ct = default)
    {
        var user = await _master.Users.FirstOrDefaultAsync(u => u.Id == userId && u.TenantId == tenantId, ct)
            ?? throw new NotFoundException("user not found");
        _master.Users.Remove(user); // user_roles cascade
        await _master.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<UserDto>> GetCouriersAsync(int tenantId, CancellationToken ct = default)
    {
        // Tüm aktif kullanıcılar; kurye rolündekiler önce gelir (atama için herkes seçilebilir)
        var all = await GetUsersAsync(tenantId, ct);
        return all.Where(u => u.IsActive)
            .OrderByDescending(u => u.Roles.Any(r => r.Name == SystemRoles.Courier))
            .ThenBy(u => u.FullName ?? u.Username)
            .ToList();
    }

    public IReadOnlyList<PermissionDto> GetPermissionCatalog() =>
        Permissions.All.Select(kv => new PermissionDto { Code = kv.Key, Description = kv.Value }).ToList();

    public async Task<IReadOnlyList<RoleDto>> GetRolesAsync(int tenantId, CancellationToken ct = default) =>
        await _master.Roles.AsNoTracking()
            .Where(r => r.TenantId == tenantId)
            .OrderBy(r => r.Name)
            .Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                Description = r.Description,
                IsSystem = r.IsSystem,
                Permissions = r.RolePermissions.Select(rp => rp.Permission.Code).ToList()
            })
            .ToListAsync(ct);

    public async Task<RoleDto> CreateRoleAsync(int tenantId, CreateRoleRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Rol adı zorunludur.");
        if (await _master.Roles.AnyAsync(r => r.TenantId == tenantId && r.Name == dto.Name, ct))
            throw new ConflictException("Bu rol adı zaten var.");

        var role = new Role { TenantId = tenantId, Name = dto.Name.Trim(), Description = dto.Description, IsSystem = false };
        _master.Roles.Add(role);
        await _master.SaveChangesAsync(ct);

        var permIds = await _master.Permissions
            .Where(p => dto.Permissions.Contains(p.Code))
            .Select(p => p.Id)
            .ToListAsync(ct);

        foreach (var pid in permIds)
            _master.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = pid });
        await _master.SaveChangesAsync(ct);

        return (await GetRolesAsync(tenantId, ct)).First(r => r.Id == role.Id);
    }

    public async Task<RoleDto> UpdateRoleAsync(int tenantId, int roleId, CreateRoleRequestDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Rol adı zorunludur.");
        var role = await _master.Roles.Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId && r.TenantId == tenantId, ct)
            ?? throw new NotFoundException("Rol bulunamadı.");
        if (role.IsSystem) throw new AppException("Sistem rolleri düzenlenemez.");
        if (await _master.Roles.AnyAsync(r => r.TenantId == tenantId && r.Name == dto.Name && r.Id != roleId, ct))
            throw new ConflictException("Bu rol adı zaten var.");

        role.Name = dto.Name.Trim();
        role.Description = dto.Description;

        // İzinleri yeniden kur
        _master.RolePermissions.RemoveRange(role.RolePermissions);
        var permIds = await _master.Permissions.Where(p => dto.Permissions.Contains(p.Code)).Select(p => p.Id).ToListAsync(ct);
        foreach (var pid in permIds)
            _master.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = pid });
        await _master.SaveChangesAsync(ct);

        return (await GetRolesAsync(tenantId, ct)).First(r => r.Id == role.Id);
    }

    public async Task DeleteRoleAsync(int tenantId, int roleId, CancellationToken ct = default)
    {
        var role = await _master.Roles.FirstOrDefaultAsync(r => r.Id == roleId && r.TenantId == tenantId, ct)
            ?? throw new NotFoundException("Rol bulunamadı.");
        if (role.IsSystem) throw new AppException("Sistem rolleri silinemez.");
        // RolePermissions ve UserRoles FK cascade ile temizlenir
        _master.Roles.Remove(role);
        await _master.SaveChangesAsync(ct);
    }
}
