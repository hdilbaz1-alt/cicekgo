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
    public class CustomerGroupController : ControllerBase
    {
        private readonly ICustomerService _service;
        private readonly ICurrentUser _current;

        public CustomerGroupController(ICustomerService service, ICurrentUser current)
        {
            _service = service;
            _current = current;
        }

        // GET api/customergroup/list
        [HttpGet("list")]
        public async Task<ActionResult<ApiResponse<IEnumerable<CustomerGroupListItemDto>>>> GroupList(CancellationToken ct)
        {
            try
            {
                var groups = await _service.GetGroupsAsync(ct);
                return Ok(ApiResponse<IEnumerable<CustomerGroupListItemDto>>.Ok(groups));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<IEnumerable<CustomerGroupListItemDto>>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // POST api/customergroup/add
        [HttpPost("add")]
        public async Task<ActionResult<ApiResponse<int>>> AddGroup([FromBody] CustomerGroupAddDto dto, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.GroupName))
                    return BadRequest(ApiResponse<int>.Fail("GroupName is required.", 400));

                var user = _current.UserName ?? "system";
                var id = await _service.CreateGroupAsync(dto, user, ct);
                return Ok(ApiResponse<int>.Ok(id));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<int>.Fail("unexpected error: " + ex.Message, 500));
            }
        }


        // DELETE api/customergroup/delete/{id}
        [HttpDelete("delete/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> DeleteGroup([FromRoute] int id, CancellationToken ct)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Invalid Id.", 400));

                var affected = await _service.DeleteGroupAsync(id, ct);
                if (affected == 0)
                    return NotFound(ApiResponse<string>.Fail("Group not found.", 404));

                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }



        // POST api/customergroup/member/add
        [HttpPost("member/add")]
        public async Task<ActionResult<ApiResponse<string>>> AddCustomerToGroup([FromBody] CustomerGroupMemberAddDto dto, CancellationToken ct)
        {
            try
            {
                if (dto.GroupId <= 0 || dto.CustomerId <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Invalid GroupId or CustomerId.", 400));

                var user = _current.UserName ?? "system";
                await _service.AddCustomerToGroupAsync(dto, user, ct);
                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // GET api/customergroup/member/list
        [HttpGet("member/list")]
        public async Task<ActionResult<ApiResponse<object>>> ListCustomerGroupMembers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
        {
            try
            {
                var (items, total) = await _service.ListCustomerGroupMembersAsync(search, page, pageSize, ct);
                return Ok(ApiResponse<object>.Ok(new { total, items }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<object>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // PUT api/customergroup/member/update/{id}
        [HttpPut("member/update/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> UpdateCustomerGroupMember([FromRoute] int id, [FromBody] CustomerGroupMemberUpdateDto dto, CancellationToken ct = default)
        {
            try
            {
                if (id <= 0 || dto.GroupId <= 0 || dto.CustomerId <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Invalid Id, GroupId or CustomerId.", 400));

                dto.Id = id;
                var user = _current.UserName ?? "system";
                await _service.UpdateCustomerGroupMemberAsync(dto, user, ct);
                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }

        // DELETE api/customergroup/member/delete/{id}
        [HttpDelete("member/delete/{id:int}")]
        public async Task<ActionResult<ApiResponse<string>>> DeleteCustomerGroupMember([FromRoute] int id, CancellationToken ct = default)
        {
            try
            {
                if (id <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Invalid Id.", 400));

                await _service.DeleteCustomerGroupMemberAsync(id, ct);
                return Ok(ApiResponse<string>.Ok("ok"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail("unexpected error: " + ex.Message, 500));
            }
        }
    }
}
