namespace CicekGo.Domain.Master;

/// <summary>Rol. Firmaya bağlıdır (tenant_id). tenant_id null => platform/sistem rolü.</summary>
public class Role
{
    public int Id { get; set; }
    public int? TenantId { get; set; }                    // null => platform/sistem rolü
    public Tenant? Tenant { get; set; }

    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsSystem { get; set; }                    // provisioning ile otomatik oluşan rol

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
