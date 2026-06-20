using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Printing;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PrintTemplateController : ControllerBase
{
    private readonly IPrintTemplateService _service;
    public PrintTemplateController(IPrintTemplateService service) => _service = service;

    // Yazdırma için her yetkili kullanıcı okuyabilir
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PrintTemplateDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<PrintTemplateDto>>.Ok(await _service.ListAsync(ct)));

    [HttpPost]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] PrintTemplateSaveDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Şablon eklendi.", 201));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] PrintTemplateSaveDto dto, CancellationToken ct)
    {
        await _service.UpdateAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Şablon güncellendi."));
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Şablon silindi."));
    }

    [HttpPost("{id:int}/default")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> SetDefault(int id, CancellationToken ct)
    {
        await _service.SetDefaultAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("default-set", "Varsayılan şablon güncellendi."));
    }
}
