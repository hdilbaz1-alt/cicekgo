using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Dashboard;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;
    public DashboardController(IDashboardService service) => _service = service;

    [HttpGet("summary")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> Summary([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<DashboardSummaryDto>.Ok(await _service.GetSummaryAsync(from, to, ct)));
}
