using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using cicekgo.Business.Common.Interfaces;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Common;
using cicekgo.Core.Customers.Dtos;

namespace cicekgo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _service;
        private readonly ICurrentUser _current;

        public CustomerController(ICustomerService service, ICurrentUser current)
        {
            _service = service;
            _current = current;
        }

        // POST api/customer/add
        [HttpPost("add")]
        public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] CustomerAddDto dto, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.CustomerName))
                    return BadRequest(ApiResponse<int>.Fail("CustomerName is required.", 400));

                var user = _current.UserName ?? "system";
                var id = await _service.AddAsync(dto, user, ct);
                return Ok(ApiResponse<int>.Ok(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customer/list  (body: search/page/pageSize)
        [HttpPost("list")]
        public async Task<ActionResult<ApiResponse<object>>> List([FromBody] CustomerListRequestDto? req, CancellationToken ct)
        {
            try
            {
                var search = string.IsNullOrWhiteSpace(req?.Search) ? null : req!.Search!.Trim();
                var page = (req?.Page is > 0) ? req!.Page : 1;
                var pageSize = (req?.PageSize is > 0) ? req!.PageSize : 50;

                var (items, total) = await _service.ListAsync(search, page, pageSize, ct);
                return Ok(ApiResponse<object>.Ok(new { total, items }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

       

        // PUT api/customer/update/{id}
        [HttpPut("update/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> Update([FromRoute] int id, [FromBody] CustomerUpdateDto dto, CancellationToken ct)
        {
            try
            {
                if (id <= 0) return BadRequest(ApiResponse<string>.Fail("invalid id", 400));
                dto.Id = id;

                var user = _current.UserName ?? "system";
                await _service.UpdateAsync(dto, user, ct);
                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // DELETE api/customer/delete/{id}
        [HttpDelete("delete/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete([FromRoute] int id, CancellationToken ct)
        {
            try
            {
                if (id <= 0) return BadRequest(ApiResponse<string>.Fail("invalid id", 400));

                await _service.DeleteAsync(id, ct);
                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

       

    }
}
