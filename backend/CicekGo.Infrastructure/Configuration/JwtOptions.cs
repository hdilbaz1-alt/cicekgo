namespace CicekGo.Infrastructure.Configuration;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = default!;
    public string Issuer { get; set; } = "cicekgo";
    public string Audience { get; set; } = "cicekgo";
    public int ExpiresMinutes { get; set; } = 480;
}
