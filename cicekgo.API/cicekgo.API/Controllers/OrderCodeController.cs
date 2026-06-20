using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Core.Orders.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace cicekgo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderCodeController : ControllerBase
    {
        private readonly IOrderCodeService _service;

        public OrderCodeController(IOrderCodeService service)
        {
            _service = service;
        }

        [HttpGet("list")]
        public async Task<ActionResult<ApiResponse<IEnumerable<OrderCodeDto>>>> List(CancellationToken ct)
        {
            var data = await _service.GetAllAsync(ct);
            return Ok(ApiResponse<IEnumerable<OrderCodeDto>>.Ok(data));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ApiResponse<OrderCodeDto?>>> GetById(int id, CancellationToken ct)
        {
            var data = await _service.GetByIdAsync(id, ct);
            if (data == null) return NotFound(ApiResponse<OrderCodeDto?>.Fail("Not found", 404));
            return Ok(ApiResponse<OrderCodeDto?>.Ok(data));
        }

        [HttpPost("add")]
        public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] OrderCodeCreateDto dto, CancellationToken ct)
        {
            var id = await _service.CreateAsync(dto, ct);
            return Ok(ApiResponse<int>.Ok(id));
        }

        [HttpPut("update/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] OrderCodeUpdateDto dto, CancellationToken ct)
        {
            var affected = await _service.UpdateAsync(id, dto, ct);
            if (affected == 0) return NotFound(ApiResponse<string>.Fail("Not found", 404));
            return Ok(ApiResponse<string>.Ok("ok"));
        }

        [HttpDelete("delete/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
        {
            var affected = await _service.DeleteAsync(id, ct);
            if (affected == 0) return NotFound(ApiResponse<string>.Fail("Not found", 404));
            return Ok(ApiResponse<string>.Ok("ok"));
        }
    }
}
