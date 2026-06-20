namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerListRequestDto
    {
        public string? Search { get; set; }    // isim / email / telefon araması
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }
}
