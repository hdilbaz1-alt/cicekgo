using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Tenants;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CompanyController : ControllerBase
{
    private readonly ICompanyProfileService _service;
    public CompanyController(ICompanyProfileService service) => _service = service;

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<CompanyProfileDto>>> Get(CancellationToken ct)
        => Ok(ApiResponse<CompanyProfileDto>.Ok(await _service.GetAsync(ct)));

    [HttpPut("profile")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<CompanyProfileDto>>> Update([FromBody] CompanyProfileUpdateDto dto, CancellationToken ct)
        => Ok(ApiResponse<CompanyProfileDto>.Ok(await _service.UpdateAsync(dto, ct), "Firma profili güncellendi."));
}
