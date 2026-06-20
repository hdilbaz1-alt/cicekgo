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
public class OrderStatusController : ControllerBase
{
    private readonly IOrderStatusService _service;
    public OrderStatusController(IOrderStatusService service) => _service = service;

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderStatusDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<OrderStatusDto>>.Ok(await _service.GetAllAsync(ct)));

    [HttpPost("add")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] OrderStatusAddRequest request, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddAsync(request, ct), "Teslimat durumu eklendi.", 201));

    [HttpPut("update/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] OrderStatusUpdateRequest request, CancellationToken ct)
    {
        await _service.UpdateAsync(id, request, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Teslimat durumu güncellendi."));
    }

    [HttpDelete("delete/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Teslimat durumu silindi."));
    }

    [HttpPost("reorder")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Reorder([FromBody] OrderStatusReorderRequest request, CancellationToken ct)
    {
        await _service.ReorderAsync(request, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Sıralama güncellendi."));
    }
}
