using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Orders;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProductTypeController : ControllerBase
{
    private readonly IProductTypeService _service;
    public ProductTypeController(IProductTypeService service) => _service = service;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductTypeDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductTypeDto>>.Ok(await _service.GetAllAsync(ct)));

    [HttpPost("add")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] ProductTypeAddRequest request, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddAsync(request, ct), "Ürün türü eklendi.", 201));

    [HttpPut("update/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] ProductTypeUpdateRequest request, CancellationToken ct)
    {
        await _service.UpdateAsync(id, request, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Ürün türü güncellendi."));
    }

    [HttpDelete("delete/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Ürün türü silindi."));
    }
}
