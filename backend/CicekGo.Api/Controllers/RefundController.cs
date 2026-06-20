using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Refunds;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RefundController : ControllerBase
{
    private readonly IRefundService _service;
    public RefundController(IRefundService service) => _service = service;

    /// <summary>İadeleri listeler. customerId verilirse o müşteri; onlyOpen=true sadece bekleyen/kısmi.</summary>
    [HttpGet("list")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RefundDto>>>> List([FromQuery] int? customerId, [FromQuery] bool onlyOpen, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RefundDto>>.Ok(await _service.ListAsync(customerId, onlyOpen, ct)));

    /// <summary>İade arama (sipariş kodu / telefon / ad). nonCariOnly=true: cari hesabı olmayanlar.</summary>
    [HttpGet("search")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<RefundDto>>>> Search([FromQuery] string? q, [FromQuery] bool nonCariOnly, [FromQuery] bool onlyOpen, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<RefundDto>>.Ok(await _service.SearchAsync(q, nonCariOnly, onlyOpen, ct)));

    [HttpGet("summary")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<RefundSummaryDto>>> Summary(CancellationToken ct)
        => Ok(ApiResponse<RefundSummaryDto>.Ok(await _service.GetSummaryAsync(ct)));

    /// <summary>İadeyi işler (tam veya kısmi). Kasa çıkışı oluşturur.</summary>
    [HttpPost("{id:int}/process")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<RefundDto>>> Process(int id, [FromBody] RefundProcessDto dto, CancellationToken ct)
        => Ok(ApiResponse<RefundDto>.Ok(await _service.ProcessAsync(id, dto, ct), "İade işlendi."));

    /// <summary>Bekleyen iadeyi "ödendi" olarak kapatır (kasa/ödeme kaydı OLUŞTURMADAN). Ödeme alacak ödemesi vb. ile yapıldıysa.</summary>
    [HttpPost("{id:int}/resolve")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<RefundDto>>> Resolve(int id, [FromBody] RefundResolveDto? dto, CancellationToken ct)
        => Ok(ApiResponse<RefundDto>.Ok(await _service.ResolveAsync(id, dto?.Note, ct), "İade kapatıldı."));
}
