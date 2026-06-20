namespace CicekGo.Domain.Tenant;

/// <summary>Müşteri-grup üyeliği (çoklu: bir müşteri birden fazla grupta olabilir).</summary>
public class CustomerGroupMember
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public CustomerGroup Group { get; set; } = default!;

    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;
}
