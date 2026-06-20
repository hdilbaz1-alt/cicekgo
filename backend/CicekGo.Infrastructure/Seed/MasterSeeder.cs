using CicekGo.Application.Abstractions;
using CicekGo.Domain.Authorization;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CicekGo.Infrastructure.Seed;

/// <summary>Master DB'yi migrate eder; izin kataloğu, platform rolü ve platform admin kullanıcısını seed eder.</summary>
public class MasterSeeder
{
    private readonly MasterDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly SeedOptions _seed;

    public MasterSeeder(MasterDbContext db, IPasswordHasher hasher, IOptions<SeedOptions> seed)
    {
        _db = db;
        _hasher = hasher;
        _seed = seed.Value;
    }

    public async Task RunAsync(CancellationToken ct = default)
    {
        await _db.Database.MigrateAsync(ct);

        // 1) İzin kataloğu
        var existingCodes = await _db.Permissions.Select(p => p.Code).ToListAsync(ct);
        foreach (var (code, desc) in Permissions.All)
        {
            if (!existingCodes.Contains(code))
                _db.Permissions.Add(new Permission { Code = code, Description = desc });
        }
        await _db.SaveChangesAsync(ct);

        // 2) Platform admin rolü (tenant_id = null)
        var platformRole = await _db.Roles
            .FirstOrDefaultAsync(r => r.TenantId == null && r.Name == SystemRoles.PlatformAdmin, ct);
        if (platformRole is null)
        {
            platformRole = new Role
            {
                TenantId = null,
                Name = SystemRoles.PlatformAdmin,
                Description = "Platform yöneticisi",
                IsSystem = true
            };
            _db.Roles.Add(platformRole);
            await _db.SaveChangesAsync(ct);
        }

        // Platform rolüne tüm izinler + tenants.manage
        await EnsureRolePermissionsAsync(platformRole.Id, Permissions.All.Keys, ct);

        // 3) Platform admin kullanıcısı
        var admin = await _db.Users.FirstOrDefaultAsync(u => u.Username == _seed.PlatformAdminUsername, ct);
        if (admin is null)
        {
            admin = new User
            {
                TenantId = null,
                Username = _seed.PlatformAdminUsername,
                Email = _seed.PlatformAdminEmail,
                FullName = "Platform Admin",
                PasswordHash = _hasher.Hash(_seed.PlatformAdminPassword),
                IsActive = true,
                IsPlatformAdmin = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.Users.Add(admin);
            await _db.SaveChangesAsync(ct);

            _db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = platformRole.Id });
            await _db.SaveChangesAsync(ct);
        }

        // 4) Mevcut firmaların sistem rollerini yeni izin kataloğuna senkronla
        await SyncAllTenantRolesAsync(ct);
    }

    private static readonly (string Name, string Desc, string[] Perms)[] RoleTemplates =
    {
        (SystemRoles.TenantAdmin, "Tüm yetkiler", Permissions.TenantAdmin),
        (SystemRoles.Manager, "Yönetici", Permissions.Manager),
        (SystemRoles.Sales, "Satış personeli", Permissions.Sales),
        (SystemRoles.Accountant, "Muhasebe / cari", Permissions.Accountant),
        (SystemRoles.Courier, "Kurye", Permissions.Courier),
        (SystemRoles.Warehouse, "Depo / stok", Permissions.Warehouse),
        (SystemRoles.ReadOnly, "Salt okunur", Permissions.ReadOnly),
    };

    private async Task SyncAllTenantRolesAsync(CancellationToken ct)
    {
        var tenantIds = await _db.Tenants.Select(t => t.Id).ToListAsync(ct);
        foreach (var tid in tenantIds)
        {
            // Eski "FirmaAdmin" rolünü yeni isme çevir (kullanıcı atamaları korunur)
            var legacyAdmin = await _db.Roles.FirstOrDefaultAsync(r => r.TenantId == tid && r.Name == "FirmaAdmin", ct);
            if (legacyAdmin is not null &&
                !await _db.Roles.AnyAsync(r => r.TenantId == tid && r.Name == SystemRoles.TenantAdmin, ct))
            {
                legacyAdmin.Name = SystemRoles.TenantAdmin;
                legacyAdmin.IsSystem = true;
                await _db.SaveChangesAsync(ct);
            }

            foreach (var (name, desc, perms) in RoleTemplates)
            {
                var role = await _db.Roles.FirstOrDefaultAsync(r => r.TenantId == tid && r.Name == name, ct);
                if (role is null)
                {
                    role = new Role { TenantId = tid, Name = name, Description = desc, IsSystem = true };
                    _db.Roles.Add(role);
                    await _db.SaveChangesAsync(ct);
                }
                await EnsureRolePermissionsAsync(role.Id, perms, ct);
            }
        }
    }

    private async Task EnsureRolePermissionsAsync(int roleId, IEnumerable<string> codes, CancellationToken ct)
    {
        var permIds = await _db.Permissions
            .Where(p => codes.Contains(p.Code))
            .Select(p => p.Id)
            .ToListAsync(ct);

        var existing = await _db.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync(ct);

        foreach (var pid in permIds.Except(existing))
            _db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = pid });

        await _db.SaveChangesAsync(ct);
    }
}
