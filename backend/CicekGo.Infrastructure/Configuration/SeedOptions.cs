namespace CicekGo.Infrastructure.Configuration;

/// <summary>Uygulama ilk açılışında oluşturulacak platform admin bilgileri.</summary>
public class SeedOptions
{
    public const string SectionName = "Seed";

    public string PlatformAdminUsername { get; set; } = "superadmin";
    public string PlatformAdminPassword { get; set; } = "ChangeMe!123";
    public string? PlatformAdminEmail { get; set; }
}
