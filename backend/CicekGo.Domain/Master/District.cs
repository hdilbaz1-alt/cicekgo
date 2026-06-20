namespace CicekGo.Domain.Master;

/// <summary>Türkiye ilçesi (bir ile bağlı). Master DB'de tek kopya.</summary>
public class District
{
    public int Id { get; set; }
    public int ProvinceId { get; set; }
    public Province? Province { get; set; }
    public string Name { get; set; } = default!;
}
