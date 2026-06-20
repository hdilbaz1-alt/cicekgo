namespace CicekGo.Domain.Tenant;

/// <summary>Ürün birimi (Adet, Kg, Gram, Demet, Buket ...). Ayarlardan yönetilir.</summary>
public class Unit
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
