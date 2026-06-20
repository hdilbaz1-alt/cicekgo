namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerListItemDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = default!;
        public string? CardName { get; set; }
        public string CustomerGroup { get; set; } = default!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? ExtraNote { get; set; }
        public bool IsActive { get; set; }
        public System.DateTime CreatedDate { get; set; }
        public string? CreatedUser { get; set; }
        public System.DateTime? UpdatedDate { get; set; }
        public string? UpdatedUser { get; set; }

        // Billing
        public int? BillingId { get; set; }
        public string? TaxNumber { get; set; }
        public string? TaxOffice { get; set; }
        public string? SendMethod { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Title { get; set; }
        public string? Country { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Address { get; set; }
        public string? BillingPhone { get; set; }
        public string? BillingEmail { get; set; }
        public string? Website { get; set; }
        public System.DateTime? BillingCreatedDate { get; set; }
        public string? BillingCreatedUser { get; set; }
        public System.DateTime? BillingUpdatedDate { get; set; }
        public string? BillingUpdatedUser { get; set; }
    }
}
