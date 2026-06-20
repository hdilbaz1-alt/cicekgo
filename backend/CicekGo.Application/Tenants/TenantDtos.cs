namespace CicekGo.Application.Tenants;

public class TenantInfoDto
{
    public string Name { get; set; } = default!;
    public DateTime? LkStart { get; set; }
    public DateTime? LkEnd { get; set; }
    public bool IsExpired { get; set; }
    public string DbName { get; set; } = default!;
    public string? LogoBase64 { get; set; }
    public bool LogoRemoveBg { get; set; }
}

public interface ITenantInfoService
{
    Task<TenantInfoDto> GetCurrentAsync(CancellationToken ct = default);
}
