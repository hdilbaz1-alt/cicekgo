namespace CicekGo.Domain.Master;

/// <summary>Türkiye ili (paylaşımlı referans verisi — Master DB'de tek kopya).</summary>
public class Province
{
    public int Id { get; set; }
    public int PlateCode { get; set; }                    // 1..81
    public string Name { get; set; } = default!;

    public ICollection<District> Districts { get; set; } = new List<District>();
}
