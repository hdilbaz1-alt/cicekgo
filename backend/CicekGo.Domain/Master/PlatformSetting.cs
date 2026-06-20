namespace CicekGo.Domain.Master;

/// <summary>Platform geneli ayar (anahtar-değer). Tüm firmalar için ortak. Örn. Google Maps API anahtarı.</summary>
public class PlatformSetting
{
    public int Id { get; set; }
    public string Key { get; set; } = default!;
    public string? Value { get; set; }
}
