namespace CicekGo.Domain.Master;

/// <summary>İzin kataloğu kaydı (statik, seed edilir).</summary>
public class Permission
{
    public int Id { get; set; }
    public string Code { get; set; } = default!;          // unique, örn. "orders.manage"
    public string? Description { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
