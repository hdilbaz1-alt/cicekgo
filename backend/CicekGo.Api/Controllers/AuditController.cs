using CicekGo.Api.Authorization;
using CicekGo.Application.Audit;
using CicekGo.Application.Common;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _service;
    public AuditController(IAuditService service) => _service = service;

    [HttpPost("list")]
    [HasPermission(Permissions.AuditView)]
    public async Task<ActionResult<ApiResponse<AuditListResult>>> List([FromBody] AuditListRequest req, CancellationToken ct)
        => Ok(ApiResponse<AuditListResult>.Ok(await _service.ListAsync(req, ct)));
}
