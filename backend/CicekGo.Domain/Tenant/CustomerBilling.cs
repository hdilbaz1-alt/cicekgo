namespace CicekGo.Domain.Tenant;

/// <summary>Müşteri fatura bilgileri (1-1).</summary>
public class CustomerBilling
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;

    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? SendMethod { get; set; }               // örn. "E-ARŞİV"
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Title { get; set; }
    public string? Country { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
