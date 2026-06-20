using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Customers.Dtos;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Element;
using iText.Layout.Properties;
using iText.Kernel.Colors;
using iText.IO.Font.Constants;
using iText.Kernel.Font;
using iText.Layout.Borders;

namespace cicekgo.Business.Services.Implementations;

public class PdfService : IPdfService
{
    private readonly ICustomerService _customerService;

    public PdfService(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    public async Task<CustomerLedgerPdfResponseDto> GenerateCustomerLedgerPdfAsync(CustomerLedgerPdfRequestDto request, CancellationToken ct = default)
    {
        // Müşteri bilgilerini al
        var customer = await _customerService.GetCustomerByIdAsync(request.CustomerId, ct);
        if (customer == null)
            throw new InvalidOperationException("Müşteri bulunamadı");

        // Cari hesap hareketlerini al
        var ledgerRequest = new CustomerLedgerListRequestDto
        {
            CustomerId = request.CustomerId,
            Page = 1,
            PageSize = 1000
        };

        var (ledgerEntries, total) = await _customerService.GetLedgerAsync(ledgerRequest, ct);
        var entries = ledgerEntries.ToList();

        // Tarih filtresi uygula
        if (request.StartDate.HasValue || request.EndDate.HasValue)
        {
            entries = entries.Where(e =>
                (!request.StartDate.HasValue || e.TransactionDate >= request.StartDate.Value) &&
                (!request.EndDate.HasValue || e.TransactionDate <= request.EndDate.Value)
            ).ToList();
        }

        // Müşteri bakiyesini al
        var balance = await _customerService.GetCustomerBalanceAsync(request.CustomerId, ct);

        // Basit PDF oluştur
        using var memoryStream = new MemoryStream();
        try
        {
            var writer = new PdfWriter(memoryStream);
            var pdf = new PdfDocument(writer);
            var document = new Document(pdf);

            // Basit başlık
            var title = new Paragraph("CARİ HESAP EKSTRESİ")
                .SetFontSize(18)
                .SetTextAlignment(TextAlignment.CENTER);
            document.Add(title);

            // Müşteri bilgisi
            var customerInfo = new Paragraph($"Müşteri: {customer.CustomerName}")
                .SetFontSize(12)
                .SetMarginTop(20);
            document.Add(customerInfo);

            // Bakiye bilgisi
            if (balance != null)
            {
                var balanceInfo = new Paragraph($"Bakiye: {balance.Balance:C}")
                    .SetFontSize(12)
                    .SetMarginTop(10);
                document.Add(balanceInfo);
            }

            // Basit tablo
            if (entries.Any())
            {
                var table = new Table(3).UseAllAvailableWidth();
                
                // Başlıklar
                table.AddHeaderCell(new Cell().Add(new Paragraph("Tarih")));
                table.AddHeaderCell(new Cell().Add(new Paragraph("İşlem")));
                table.AddHeaderCell(new Cell().Add(new Paragraph("Tutar")));

                // Veriler
                foreach (var entry in entries.Take(10)) // İlk 10 kayıt
                {
                    table.AddCell(new Cell().Add(new Paragraph(entry.TransactionDate.ToString("dd.MM.yyyy"))));
                    table.AddCell(new Cell().Add(new Paragraph(entry.TransactionType)));
                    table.AddCell(new Cell().Add(new Paragraph(entry.Balance.ToString("C"))));
                }

                document.Add(table);
            }

            document.Close();
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"PDF oluşturma hatası: {ex.Message}");
        }

        var fileName = $"CariHesap_{customer.CustomerName.Replace(" ", "_")}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";

                return new CustomerLedgerPdfResponseDto
        {
            FileName = fileName,
            FileContent = memoryStream.ToArray(),
            ContentType = "application/pdf",
            FileSize = memoryStream.Length
        };
    }
}
