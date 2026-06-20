namespace CicekGo.Domain.Tenant;

public class OrderStatus
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Color { get; set; }    // hex renk (örn. #ef4444)
    public bool IsSystem { get; set; }     // İptal Edildi gibi silinemez/yeniden adlandırılamaz
}
