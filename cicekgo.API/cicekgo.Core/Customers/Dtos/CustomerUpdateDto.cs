namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerUpdateDto
    {
        public int Id { get; set; } // Customers.Id (route'tan da alacağız; burada da dursun)

        // Customers (NULL gelenler güncellenmez)
        public string? CustomerName { get; set; }
        public string? CardName { get; set; }
        public string? CustomerGroup { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? ExtraNote { get; set; }
        public bool? IsActive { get; set; }

        // Billing (opsiyonel, yoksa upsert yapılmaz)
        public CustomerBillingDto? Billing { get; set; }

        // Grup ID listesi (opsiyonel; 0 veya boş gönderilirse grup kaydı yapılmaz)
        public List<int>? GroupIds { get; set; }
    }
}
