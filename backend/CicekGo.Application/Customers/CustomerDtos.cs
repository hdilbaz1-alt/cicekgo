namespace CicekGo.Application.Customers;

public class CustomerBillingDto
{
    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? SendMethod { get; set; } = "E-ARŞİV";
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Title { get; set; }
    public string? Country { get; set; } = "TÜRKİYE";
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
}

public class CustomerAddDto
{
    public string CustomerName { get; set; } = default!;
    public string? CardName { get; set; }
    public string? CustomerGroup { get; set; } = "Diğer";
    public string? Phone { get; set; }
    public string? SecondaryPhone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? CustomerType { get; set; }
    public string? Tag { get; set; }
    public decimal? OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? ExtraNote { get; set; }
    public bool? IsActive { get; set; } = true;

    public CustomerBillingDto? Billing { get; set; }
    public List<int>? GroupIds { get; set; }
}

public class CustomerUpdateDto
{
    public int Id { get; set; }
    public string? CustomerName { get; set; }
    public string? CardName { get; set; }
    public string? CustomerGroup { get; set; }
    public string? Phone { get; set; }
    public string? SecondaryPhone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? CustomerType { get; set; }
    public string? Tag { get; set; }
    public decimal? OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? ExtraNote { get; set; }
    public bool? IsActive { get; set; }

    public CustomerBillingDto? Billing { get; set; }
    public List<int>? GroupIds { get; set; }
}

public class CustomerListRequestDto
{
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class CustomerDto
{
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = default!;
    public string? CardName { get; set; }
    public string? CustomerGroup { get; set; }
    public string? Phone { get; set; }
    public string? SecondaryPhone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? CustomerType { get; set; }
    public string? Tag { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? ExtraNote { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedUser { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string? UpdatedUser { get; set; }
}

/// <summary>Müşteri + fatura bilgileri düz (frontend list ekranı).</summary>
public class CustomerListItemDto : CustomerDto
{
    public int? BillingId { get; set; }
    public string? TaxNumber { get; set; }
    public string? TaxOffice { get; set; }
    public string? SendMethod { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Title { get; set; }
    public string? Country { get; set; }
    public string? BillingCity { get; set; }
    public string? BillingDistrict { get; set; }
    public string? BillingAddress { get; set; }
    public string? BillingPhone { get; set; }
    public string? BillingEmail { get; set; }
    public string? Website { get; set; }
}
