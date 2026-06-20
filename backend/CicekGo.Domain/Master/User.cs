namespace CicekGo.Domain.Master;

/// <summary>Bir kullanıcı. Bir firmaya bağlıdır (tenant_id). Platform admin için tenant_id null.</summary>
public class User
{
    public int Id { get; set; }
    public int? TenantId { get; set; }                    // null => platform admin
    public Tenant? Tenant { get; set; }

    public string Username { get; set; } = default!;      // unique
    public string? Email { get; set; }
    public string PasswordHash { get; set; } = default!;
    public string? FullName { get; set; }

    public bool IsActive { get; set; } = true;
    public bool IsPlatformAdmin { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public DateTime? DeletedAtUtc { get; set; }            // self-servis hesap silme (soft)

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
