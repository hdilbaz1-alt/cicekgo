using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Orders.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace cicekgo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderStatusController : ControllerBase
{
    private readonly IOrderStatusService _service;

    public OrderStatusController(IOrderStatusService service)
    {
        _service = service;
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<IEnumerable<OrderStatusDto>>>> List(CancellationToken ct)
    {
        try
        {
            var data = await _service.GetAllAsync(ct);
            return Ok(ApiResponse<IEnumerable<OrderStatusDto>>.Ok(data));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<IEnumerable<OrderStatusDto>>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ApiResponse<OrderStatusDto?>>> GetById(int id, CancellationToken ct)
    {
        try
        {
            var data = await _service.GetByIdAsync(id, ct);
            if (data == null) return NotFound(ApiResponse<OrderStatusDto?>.Fail("Not found", 404));
            return Ok(ApiResponse<OrderStatusDto?>.Ok(data));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<OrderStatusDto?>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    [HttpPost("add")]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] OrderStatusAddRequest request, CancellationToken ct)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.StatusName))
                return BadRequest(ApiResponse<int>.Fail("StatusName is required", 400));

            var id = await _service.AddAsync(request, "system", ct);
            return Ok(ApiResponse<int>.Ok(id));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    [HttpPut("update/{id:int}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] OrderStatusUpdateRequest request, CancellationToken ct)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.StatusName))
                return BadRequest(ApiResponse<string>.Fail("StatusName is required", 400));

            var success = await _service.UpdateAsync(id, request, "system", ct);
            if (!success) return NotFound(ApiResponse<string>.Fail("Not found", 404));
            return Ok(ApiResponse<string>.Ok("ok"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

    [HttpDelete("delete/{id:int}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        try
        {
            var success = await _service.DeleteAsync(id, ct);
            if (!success) return NotFound(ApiResponse<string>.Fail("Not found", 404));
            return Ok(ApiResponse<string>.Ok("ok"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
        }
    }
}
