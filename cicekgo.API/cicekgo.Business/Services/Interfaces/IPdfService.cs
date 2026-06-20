using cicekgo.Core.Customers.Dtos;

namespace cicekgo.Business.Services.Interfaces;

public interface IPdfService
{
    Task<CustomerLedgerPdfResponseDto> GenerateCustomerLedgerPdfAsync(CustomerLedgerPdfRequestDto request, CancellationToken ct = default);
}
