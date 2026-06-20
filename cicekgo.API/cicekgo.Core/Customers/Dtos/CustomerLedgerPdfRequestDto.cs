namespace cicekgo.Core.Customers.Dtos;

public class CustomerLedgerPdfRequestDto
{
    public int CustomerId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IncludeBalance { get; set; } = true;
    public bool IncludeTransactions { get; set; } = true;
    public string? CompanyName { get; set; } = "Çiçekgo";
    public string? CompanyAddress { get; set; }
    public string? CompanyPhone { get; set; }
}
