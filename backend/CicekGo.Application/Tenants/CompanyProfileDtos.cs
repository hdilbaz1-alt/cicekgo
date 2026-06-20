namespace CicekGo.Application.Tenants;

public class CompanyProfileDto
{
    public string Name { get; set; } = default!;
    public string? LogoBase64 { get; set; }
    public bool LogoRemoveBg { get; set; }
}

public class CompanyProfileUpdateDto
{
    public string? Name { get; set; }
    public string? LogoBase64 { get; set; }   // null => değiştirme; "" => kaldır
    public bool? LogoRemoveBg { get; set; }
}

public interface ICompanyProfileService
{
    Task<CompanyProfileDto> GetAsync(CancellationToken ct = default);
    Task<CompanyProfileDto> UpdateAsync(CompanyProfileUpdateDto dto, CancellationToken ct = default);
}
