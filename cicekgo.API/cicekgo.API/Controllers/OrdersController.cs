using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Orders.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Globalization;

namespace cicekgo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;

    public OrdersController(IOrderService service)
    {
        _service = service;
    }

    // POST /api/orders  -> create (mevcut)
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<ApiResponse<OrderCreateResultDto>>> Create([FromBody] OrderCreateDto dto, CancellationToken ct)
    {
        try
        {
            var result = await _service.CreateAsync(dto, ct);
            return Ok(ApiResponse<OrderCreateResultDto>.Ok(result));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<OrderCreateResultDto>.Fail(ex.Message, 400));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<OrderCreateResultDto>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    // GET /api/orders/list?startDate=2025-08-13&endDate=2025-08-14&by=created&Page=1&PageSize=50
    [Authorize]
    [HttpPost("list")]
    public async Task<ActionResult<ApiResponse<object>>> List([FromBody] OrderListRequestDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.StartDate) || string.IsNullOrWhiteSpace(request.EndDate))
            return BadRequest(ApiResponse<object>.Fail("StartDate and EndDate are required (yyyy-MM-dd).", 400));

        if (!DateTime.TryParseExact(request.StartDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var start))
            return BadRequest(ApiResponse<object>.Fail("Invalid StartDate format. Use yyyy-MM-dd.", 400));

        if (!DateTime.TryParseExact(request.EndDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var end))
            return BadRequest(ApiResponse<object>.Fail("Invalid EndDate format. Use yyyy-MM-dd.", 400));

        if (request.Page <= 0) request.Page = 1;
        if (request.PageSize <= 0) request.PageSize = 50;

        try
        {
            // DeliveryDate için end date'e 1 gün ekle (end of day)
            var endDate = end.AddDays(1);
            var (items, total) = await _service.ListOrdersAsync(start, endDate, request.Page, request.PageSize, ct);

            return Ok(ApiResponse<object>.Ok(new
            {
                totalCount = total,
                page = request.Page,
                pageSize = request.PageSize,
                items
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    [Authorize]
    [HttpPut("{orderCode}")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateByCode(string orderCode, [FromBody] OrderUpdateDto dto, CancellationToken ct)
    {
        try
        {
            await _service.UpdateByOrderCodeAsync(orderCode, dto, ct);
            return Ok(ApiResponse<string>.Ok("updated"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<string>.Fail(ex.Message, 400));
        }
        catch (InvalidOperationException ex) when (ex.Message == "order not found")
        {
            return NotFound(ApiResponse<string>.Fail("order not found", 404));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
        }
    }




}
