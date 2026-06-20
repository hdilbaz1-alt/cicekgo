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
public class StockController : ControllerBase
{
    private readonly IStockService _service;
    public StockController(IStockService service) => _service = service;

    [HttpGet("movements")]
    [HasPermission(Permissions.StockView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockMovementDto>>>> Movements([FromQuery] int? productId, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<StockMovementDto>>.Ok(await _service.GetMovementsAsync(productId, ct)));

    [HttpPost("movements")]
    [HasPermission(Permissions.StockManage)]
    public async Task<ActionResult<ApiResponse<int>>> AddMovement([FromBody] StockMovementCreateDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.AddMovementAsync(dto, ct), "Stok hareketi eklendi.", 201));

    [HttpGet("critical")]
    [HasPermission(Permissions.StockView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductDto>>>> Critical(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductDto>>.Ok(await _service.GetCriticalAsync(ct)));
}
