using System.Text.RegularExpressions;
using CicekGo.Application.Abstractions;
using CicekGo.Application.Admin;
using CicekGo.Application.Common;
using CicekGo.Domain.Authorization;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CicekGo.Infrastructure.Services;

public partial class TenantAdminService : ITenantAdminService
{
    private readonly MasterDbContext _master;
    private readonly ITenantProvisioner _provisioner;
    private readonly IPasswordHasher _hasher;
    private readonly ITenantConnectionResolver _resolver;
    private readonly DatabaseOptions _dbOptions;

    public TenantAdminService(
        MasterDbContext master,
        ITenantProvisioner provisioner,
        IPasswordHasher hasher,
        ITenantConnectionResolver resolver,
        IOptions<DatabaseOptions> dbOptions)
    {
        _master = master;
        _provisioner = provisioner;
        _hasher = hasher;
        _resolver = resolver;
        _dbOptions = dbOptions.Value;
    }

    [GeneratedRegex("^[a-z0-9_]{2,40}$")]
    private static partial Regex SlugRegex();

    public async Task<TenantDto> CreateTenantAsync(CreateTenantRequestDto dto, CancellationToken ct = default)
    {
        var slug = (dto.Slug ?? "").Trim().ToLowerInvariant();
        if (!SlugRegex().IsMatch(slug))
            throw new AppException("Slug yalnızca a-z, 0-9 ve _ içerebilir (2-40 karakter).");

        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Firma adı zorunludur.");
        if (string.IsNullOrWhiteSpace(dto.AdminUsername)) throw new AppException("Admin kullanıcı adı zorunludur.");
        if (string.IsNullOrWhiteSpace(dto.AdminPassword)) throw new AppException("Admin şifresi zorunludur.");

        if (await _master.Tenants.AnyAsync(t => t.Slug == slug, ct))
            throw new ConflictException("Bu slug zaten kullanımda.");
        if (await _master.Users.AnyAsync(u => u.Username == dto.AdminUsername, ct))
            throw new ConflictException("Bu kullanıcı adı zaten kullanımda.");

        var dbName = _dbOptions.TenantDbPrefix + slug;

        var tenant = new Tenant
        {
            Name = dto.Name.Trim(),
            Slug = slug,
            DbName = dbName,
            IsActive = true,
            LicenseStartUtc = dto.LicenseStartUtc ?? DateTime.UtcNow.Date,
            LicenseEndUtc = dto.LicenseEndUtc,
            CreatedAtUtc = DateTime.UtcNow
        };
        _master.Tenants.Add(tenant);
        await _master.SaveChangesAsync(ct);

        // Fiziksel DB + şema + seed
        await _provisioner.ProvisionAsync(dbName, ct);

        // Firma sistem rolleri (master DB'de, tenant_id = tenant.Id)
        var adminRole = await CreateRoleInternalAsync(tenant.Id, SystemRoles.TenantAdmin, "Tüm yetkiler", Permissions.TenantAdmin, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.Manager, "Yönetici", Permissions.Manager, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.Sales, "Satış personeli", Permissions.Sales, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.Accountant, "Muhasebe / cari", Permissions.Accountant, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.Courier, "Kurye", Permissions.Courier, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.Warehouse, "Depo / stok", Permissions.Warehouse, isSystem: true, ct);
        await CreateRoleInternalAsync(tenant.Id, SystemRoles.ReadOnly, "Salt okunur", Permissions.ReadOnly, isSystem: true, ct);

        // Firma admin kullanıcısı
        var adminUser = new User
        {
            TenantId = tenant.Id,
            Username = dto.AdminUsername.Trim(),
            Email = dto.AdminEmail,
            FullName = dto.AdminFullName ?? dto.AdminUsername,
            PasswordHash = _hasher.Hash(dto.AdminPassword),
            IsActive = true,
            IsPlatformAdmin = false,
            CreatedAtUtc = DateTime.UtcNow
        };
        _master.Users.Add(adminUser);
        await _master.SaveChangesAsync(ct);

        _master.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
        await _master.SaveChangesAsync(ct);

        return Map(tenant);
    }

    public async Task<IReadOnlyList<TenantDto>> GetTenantsAsync(CancellationToken ct = default) =>
        await _master.Tenants.AsNoTracking()
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => Map(t))
            .ToListAsync(ct);

    public async Task<TenantDto> UpdateTenantAsync(int id, UpdateTenantRequestDto dto, CancellationToken ct = default)
    {
        var t = await _master.Tenants.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("tenant not found");

        if (!string.IsNullOrWhiteSpace(dto.Name)) t.Name = dto.Name.Trim();
        if (dto.IsActive.HasValue) t.IsActive = dto.IsActive.Value;
        if (dto.LicenseStartUtc.HasValue) t.LicenseStartUtc = dto.LicenseStartUtc;
        if (dto.LicenseEndUtc.HasValue) t.LicenseEndUtc = dto.LicenseEndUtc;
        t.UpdatedAtUtc = DateTime.UtcNow;

        await _master.SaveChangesAsync(ct);
        _resolver.Invalidate(t.Id);
        return Map(t);
    }

    public async Task DeleteTenantAsync(int id, bool dropDatabase, CancellationToken ct = default)
    {
        var t = await _master.Tenants.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("tenant not found");

        // Master kayıtlarını temizle: kullanıcılar, roller (role_permissions/user_roles cascade).
        var users = await _master.Users.Where(u => u.TenantId == id).ToListAsync(ct);
        _master.Users.RemoveRange(users);
        var roles = await _master.Roles.Where(r => r.TenantId == id).ToListAsync(ct);
        _master.Roles.RemoveRange(roles);
        _master.Tenants.Remove(t);
        await _master.SaveChangesAsync(ct);

        _resolver.Invalidate(id);

        if (dropDatabase)
            await _provisioner.DeprovisionAsync(t.DbName, ct);
    }

    private async Task<Role> CreateRoleInternalAsync(int tenantId, string name, string? description, IEnumerable<string> permCodes, bool isSystem, CancellationToken ct)
    {
        var role = new Role { TenantId = tenantId, Name = name, Description = description, IsSystem = isSystem };
        _master.Roles.Add(role);
        await _master.SaveChangesAsync(ct);

        var permIds = await _master.Permissions
            .Where(p => permCodes.Contains(p.Code))
            .Select(p => p.Id)
            .ToListAsync(ct);

        foreach (var pid in permIds)
            _master.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = pid });

        await _master.SaveChangesAsync(ct);
        return role;
    }

    private static TenantDto Map(Tenant t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Slug = t.Slug,
        DbName = t.DbName,
        IsActive = t.IsActive,
        LicenseStartUtc = t.LicenseStartUtc,
        LicenseEndUtc = t.LicenseEndUtc,
        CreatedAtUtc = t.CreatedAtUtc
    };
}
