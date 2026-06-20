namespace CicekGo.Domain.Tenant;

public class CustomerGroup
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<CustomerGroupMember> Members { get; set; } = new List<CustomerGroupMember>();
}
