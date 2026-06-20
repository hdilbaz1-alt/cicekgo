using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CustomerLedgerController : ControllerBase
{
    private readonly ICustomerLedgerService _service;
    public CustomerLedgerController(ICustomerLedgerService service) => _service = service;

    [HttpGet("balances")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CustomerBalanceDto>>>> Balances(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CustomerBalanceDto>>.Ok(await _service.GetAllBalancesAsync(ct)));

    [HttpPost("list")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<object>>> List([FromBody] CustomerLedgerListRequestDto request, CancellationToken ct)
    {
        var result = await _service.GetLedgerAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new
        {
            totalCount = result.TotalCount,
            page = result.Page,
            pageSize = result.PageSize,
            items = result.Items
        }));
    }

    [HttpPost("payment")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<int>>> Payment([FromBody] CustomerPaymentDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddPaymentAsync(dto, ct), "Ödeme kaydedildi.", 201));

    [HttpPost("order-payment")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<int>>> OrderPayment([FromBody] CustomerOrderPaymentDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddOrderPaymentAsync(dto, ct), "Sipariş ödemesi kaydedildi.", 201));

    [HttpPost("payout")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<int>>> Payout([FromBody] CustomerPayoutDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddCreditPayoutAsync(dto, ct), "Alacak ödendi.", 201));

    [HttpPost("entry")]
    [HasPermission(Permissions.FinanceManualMovement)]
    public async Task<ActionResult<ApiResponse<int>>> Entry([FromBody] CustomerLedgerAddDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddEntryAsync(dto, ct), "Cari hareket eklendi.", 201));
}
