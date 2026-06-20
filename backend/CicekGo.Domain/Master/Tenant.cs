namespace CicekGo.Domain.Master;

/// <summary>Bir firma (kiracı). Her firmanın kendine ait fiziksel bir PostgreSQL veritabanı vardır.</summary>
public class Tenant
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string Slug { get; set; } = default!;          // unique, db adı türetmek için (örn. "demo")
    public string DbName { get; set; } = default!;        // örn. "cicekgo_tenant_demo"
    public bool IsActive { get; set; } = true;

    public string? LogoBase64 { get; set; }      // data URL (image/png;base64,...)
    public bool LogoRemoveBg { get; set; }        // logoyu beyaz zemin temizleme ile göster

    public DateTime? LicenseStartUtc { get; set; }
    public DateTime? LicenseEndUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Role> Roles { get; set; } = new List<Role>();
}
