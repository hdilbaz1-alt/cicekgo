namespace CicekGo.Domain.Tenant;

/// <summary>Kritik işlem denetim kaydı. Firma DB'sinde tutulur, değiştirilemez (sadece insert).</summary>
public class AuditLog
{
    public int Id { get; set; }
    public int? UserId { get; set; }                      // master users.id (cross-db)
    public string? UserFullName { get; set; }
    public string ActionType { get; set; } = default!;    // CREATE / UPDATE / DELETE / RESTORE / LOGIN / ACCESS_DENIED ...
    public string? ModuleName { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? Description { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
}
