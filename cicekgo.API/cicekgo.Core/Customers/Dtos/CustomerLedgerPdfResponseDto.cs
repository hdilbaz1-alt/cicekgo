namespace cicekgo.Core.Customers.Dtos;

public class CustomerLedgerPdfResponseDto
{
    public string FileName { get; set; } = string.Empty;
    public byte[] FileContent { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
    public long FileSize { get; set; }
}
