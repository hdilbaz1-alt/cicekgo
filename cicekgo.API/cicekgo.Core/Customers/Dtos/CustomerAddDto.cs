namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerAddDto
    {
        // Customers
        public string CustomerName { get; set; } = default!;
        public string? CardName { get; set; }
        public string CustomerGroup { get; set; } = "Diğer";
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? ExtraNote { get; set; }
        public bool? IsActive { get; set; } = true;

        // Billing (opsiyonel)
        public CustomerBillingDto? Billing { get; set; }

        // NEW: Müşteri grupları (çoklu). 0 => ekleme yapma
        public List<int>? GroupIds { get; set; }
    }

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
}
