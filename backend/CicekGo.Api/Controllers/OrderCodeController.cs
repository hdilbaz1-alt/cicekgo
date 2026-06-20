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
public class OrderCodeController : ControllerBase
{
    private readonly IOrderCodeService _service;
    public OrderCodeController(IOrderCodeService service) => _service = service;

    [HttpGet("list")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderCodeDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<OrderCodeDto>>.Ok(await _service.GetAllAsync(ct)));

    [HttpPost("Add")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] OrderCodeCreateDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Sipariş kodu eklendi.", 201));

    [HttpPut("update/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] OrderCodeUpdateDto dto, CancellationToken ct)
    {
        await _service.UpdateAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Sipariş kodu güncellendi."));
    }

    [HttpDelete("delete/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Sipariş kodu silindi."));
    }
}
