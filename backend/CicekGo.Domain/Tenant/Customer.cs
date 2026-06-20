namespace CicekGo.Domain.Tenant;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string? CardName { get; set; }
    public string? CustomerGroup { get; set; }            // serbest metin grup etiketi (frontend ile uyum)
    public string? Phone { get; set; }
    public string? SecondaryPhone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? CustomerType { get; set; }             // Bireysel / Kurumsal / Bayi / Özel
    public string? Tag { get; set; }                      // Sadık / Borçlu / VIP / Riskli / Kurumsal
    public decimal OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? ExtraNote { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? DeletedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public CustomerBilling? Billing { get; set; }
    public ICollection<CustomerGroupMember> GroupMemberships { get; set; } = new List<CustomerGroupMember>();
    public ICollection<CustomerLedgerEntry> LedgerEntries { get; set; } = new List<CustomerLedgerEntry>();
}
