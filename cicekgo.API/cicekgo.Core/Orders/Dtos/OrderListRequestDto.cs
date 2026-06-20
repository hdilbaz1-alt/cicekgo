namespace cicekgo.Core.Orders.Dtos;

public class OrderListRequestDto
{
    public string StartDate { get; set; } // "2025-08-13" formatında gelecek
    public string EndDate { get; set; }   // "2025-08-13" formatında gelecek
    public int Page { get; set; }
    public int PageSize { get; set; }
}