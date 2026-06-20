namespace cicekgo.Core.Tenants.Dtos;

public class TenantInfoDto
{
    public string Name { get; set; } = default!;
    public DateTime? LkStart { get; set; }
    public DateTime? LkEnd { get; set; }
    public bool IsExpired { get; set; }
    public string? DbName { get; set; } // sadece IsExpired=false iken dolu
}
