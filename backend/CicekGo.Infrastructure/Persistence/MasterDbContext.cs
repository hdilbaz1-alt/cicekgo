using CicekGo.Domain.Master;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Persistence;

/// <summary>Master/Identity DB (cicekgo_master): firmalar, kullanıcılar, roller, izinler.</summary>
public class MasterDbContext : DbContext
{
    public MasterDbContext(DbContextOptions<MasterDbContext> options) : base(options) { }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Province> Provinces => Set<Province>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<PlatformSetting> PlatformSettings => Set<PlatformSetting>();
    public DbSet<PushSubscription> PushSubscriptions => Set<PushSubscription>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailOutbox> EmailOutbox => Set<EmailOutbox>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Tenant>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Slug).IsRequired().HasMaxLength(63);
            e.Property(x => x.DbName).IsRequired().HasMaxLength(63);
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasIndex(x => x.DbName).IsUnique();
        });

        b.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Username).IsRequired().HasMaxLength(100);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200);
            e.HasIndex(x => x.Username).IsUnique();
            e.HasOne(x => x.Tenant).WithMany(t => t.Users)
                .HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Role>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.Description).HasMaxLength(300);
            e.HasIndex(x => new { x.TenantId, x.Name }).IsUnique();
            e.HasOne(x => x.Tenant).WithMany(t => t.Roles)
                .HasForeignKey(x => x.TenantId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Permission>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(100);
            e.Property(x => x.Description).HasMaxLength(300);
            e.HasIndex(x => x.Code).IsUnique();
        });

        b.Entity<RolePermission>(e =>
        {
            e.HasKey(x => new { x.RoleId, x.PermissionId });
            e.HasOne(x => x.Role).WithMany(r => r.RolePermissions)
                .HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Permission).WithMany(p => p.RolePermissions)
                .HasForeignKey(x => x.PermissionId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UserRole>(e =>
        {
            e.HasKey(x => new { x.UserId, x.RoleId });
            e.HasOne(x => x.User).WithMany(u => u.UserRoles)
                .HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Role).WithMany(r => r.UserRoles)
                .HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Province>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => x.PlateCode).IsUnique();
            e.HasIndex(x => x.Name);
        });

        b.Entity<District>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => new { x.ProvinceId, x.Name }).IsUnique();
            e.HasOne(x => x.Province).WithMany(p => p.Districts)
                .HasForeignKey(x => x.ProvinceId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PlatformSetting>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).IsRequired().HasMaxLength(100);
            e.Property(x => x.Value).HasMaxLength(1000);
            e.HasIndex(x => x.Key).IsUnique();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TokenHash).IsRequired().HasMaxLength(100);
            e.Property(x => x.ReplacedByHash).HasMaxLength(100);
            e.Property(x => x.UserAgent).HasMaxLength(400);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.HasIndex(x => x.UserId);
            e.Ignore(x => x.IsActive);
        });

        b.Entity<PushSubscription>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Endpoint).IsRequired().HasMaxLength(500);
            e.Property(x => x.P256dh).IsRequired().HasMaxLength(255);
            e.Property(x => x.Auth).IsRequired().HasMaxLength(255);
            e.Property(x => x.UserAgent).HasMaxLength(400);
            e.HasIndex(x => x.Endpoint).IsUnique();
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.TenantId);
        });

        b.Entity<Notification>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(200);
            e.Property(x => x.Body).IsRequired().HasMaxLength(1000);
            e.Property(x => x.Url).HasMaxLength(500);
            e.Property(x => x.Type).HasMaxLength(50);
            e.HasIndex(x => new { x.UserId, x.CreatedAtUtc });
        });

        b.Entity<EmailOutbox>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderCode).IsRequired().HasMaxLength(64);
            e.Property(x => x.Audience).IsRequired().HasMaxLength(16);
            e.Property(x => x.ToEmail).IsRequired().HasMaxLength(256);
            e.Property(x => x.Subject).IsRequired().HasMaxLength(400);
            e.Property(x => x.Status).IsRequired().HasMaxLength(16);
            e.Property(x => x.DedupKey).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.DedupKey).IsUnique();
            e.HasIndex(x => new { x.Status, x.NextAttemptUtc });
        });
    }
}
