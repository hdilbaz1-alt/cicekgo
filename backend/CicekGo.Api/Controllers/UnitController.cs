using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Products;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class UnitController : ControllerBase
{
    private readonly IUnitService _service;
    public UnitController(IUnitService service) => _service = service;

    // Listeleme: ürün ekleyebilen herkes birimleri görebilmeli
    [HttpGet("list")]
    [HasPermission(Permissions.ProductsView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<UnitDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<UnitDto>>.Ok(await _service.GetAllAsync(ct)));

    [HttpPost]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] UnitRequest dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Birim eklendi.", 201));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] UnitRequest dto, CancellationToken ct)
    {
        await _service.UpdateAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Birim güncellendi."));
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Birim silindi."));
    }
}
