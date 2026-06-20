using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

public class GroupMemberListRequest
{
    public string? Search { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CustomerGroupController : ControllerBase
{
    private readonly ICustomerGroupService _service;
    public CustomerGroupController(ICustomerGroupService service) => _service = service;

    [HttpGet("list")]
    [HasPermission(Permissions.CustomersView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CustomerGroupListItemDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<CustomerGroupListItemDto>>.Ok(await _service.GetGroupsAsync(ct)));

    [HttpPost("add")]
    [HasPermission(Permissions.CustomersUpdate)]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] CustomerGroupAddDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateGroupAsync(dto, ct), "Grup oluşturuldu.", 201));

    [HttpDelete("delete/{id:int}")]
    [HasPermission(Permissions.CustomersUpdate)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteGroupAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Grup silindi."));
    }

    [HttpPost("member/add")]
    [HasPermission(Permissions.CustomersUpdate)]
    public async Task<ActionResult<ApiResponse<string>>> AddMember([FromBody] CustomerGroupMemberAddDto dto, CancellationToken ct)
    {
        await _service.AddMemberAsync(dto, ct);
        return Ok(ApiResponse<string>.Ok("added", "Üye eklendi.", 201));
    }

    [HttpPost("member/list")]
    [HasPermission(Permissions.CustomersView)]
    public async Task<ActionResult<ApiResponse<object>>> ListMembers([FromBody] GroupMemberListRequest request, CancellationToken ct)
    {
        var result = await _service.ListMembersAsync(request.Search, request.Page, request.PageSize, ct);
        return Ok(ApiResponse<object>.Ok(new
        {
            total = result.TotalCount,
            totalCount = result.TotalCount,
            page = result.Page,
            pageSize = result.PageSize,
            items = result.Items
        }));
    }
}
