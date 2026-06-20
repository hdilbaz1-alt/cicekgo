using CicekGo.Application.Common;
using CicekGo.Application.Tenants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class TenantPingController : ControllerBase
{
    private readonly ITenantInfoService _service;
    public TenantPingController(ITenantInfoService service) => _service = service;

    [HttpGet("info")]
    public async Task<ActionResult<ApiResponse<TenantInfoDto>>> Info(CancellationToken ct)
    {
        var info = await _service.GetCurrentAsync(ct);
        return Ok(ApiResponse<TenantInfoDto>.Ok(info));
    }
}
