namespace CicekGo.Domain.Tenant;

public class ProductType
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}
