using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Reports;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _service;
    public ReportsController(IReportService service) => _service = service;

    [HttpGet("sales")]
    [HasPermission(Permissions.ReportsViewSales)]
    public async Task<ActionResult<ApiResponse<SalesReportDto>>> Sales([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<SalesReportDto>.Ok(await _service.SalesAsync(from, to, ct)));

    [HttpGet("products")]
    [HasPermission(Permissions.ReportsViewProducts)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductRowDto>>>> Products([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<ProductRowDto>>.Ok(await _service.ProductsAsync(from, to, ct)));

    [HttpGet("customers")]
    [HasPermission(Permissions.ReportsViewCustomers)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CustomerRowDto>>>> Customers([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CustomerRowDto>>.Ok(await _service.CustomersAsync(from, to, ct)));

    [HttpGet("cash")]
    [HasPermission(Permissions.ReportsViewCash)]
    public async Task<ActionResult<ApiResponse<CashReportDto>>> Cash([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<CashReportDto>.Ok(await _service.CashAsync(from, to, ct)));

    [HttpGet("couriers")]
    [HasPermission(Permissions.ReportsViewCouriers)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CourierRowDto>>>> Couriers([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CourierRowDto>>.Ok(await _service.CouriersAsync(from, to, ct)));
}
