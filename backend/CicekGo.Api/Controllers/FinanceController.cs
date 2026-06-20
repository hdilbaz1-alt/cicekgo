using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Finance;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ExpenseController : ControllerBase
{
    private readonly IExpenseService _service;
    public ExpenseController(IExpenseService service) => _service = service;

    [HttpGet("list")]
    [HasPermission(Permissions.FinanceViewCash)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ExpenseDto>>>> List([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ExpenseDto>>.Ok(await _service.GetAllAsync(from, to, ct)));

    [HttpPost]
    [HasPermission(Permissions.FinanceManualMovement)]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] ExpenseCreateDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Gider eklendi.", 201));

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.FinanceManualMovement)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Gider silindi."));
    }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CashController : ControllerBase
{
    private readonly ICashService _service;
    public CashController(ICashService service) => _service = service;

    [HttpGet("movements")]
    [HasPermission(Permissions.FinanceViewCash)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CashMovementDto>>>> Movements([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CashMovementDto>>.Ok(await _service.GetMovementsAsync(from, to, ct)));

    [HttpGet("summary")]
    [HasPermission(Permissions.FinanceViewGeneralLedger)]
    public async Task<ActionResult<ApiResponse<GeneralSummaryDto>>> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<GeneralSummaryDto>.Ok(await _service.GetSummaryAsync(from, to, ct)));
}
