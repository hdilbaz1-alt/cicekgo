using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _service;
    public CustomerController(ICustomerService service) => _service = service;

    [HttpPost("List")]
    [HasPermission(Permissions.CustomersView)]
    public async Task<ActionResult<ApiResponse<object>>> List([FromBody] CustomerListRequestDto request, CancellationToken ct)
    {
        var result = await _service.ListAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new
        {
            total = result.TotalCount,
            totalCount = result.TotalCount,
            page = result.Page,
            pageSize = result.PageSize,
            items = result.Items
        }));
    }

    [HttpGet("{id:int}")]
    [HasPermission(Permissions.CustomersView)]
    public async Task<ActionResult<ApiResponse<CustomerDto>>> GetById(int id, CancellationToken ct)
    {
        var customer = await _service.GetByIdAsync(id, ct) ?? throw new NotFoundException("customer not found");
        return Ok(ApiResponse<CustomerDto>.Ok(customer));
    }

    [HttpPost]
    [HasPermission(Permissions.CustomersCreate)]
    public async Task<ActionResult<ApiResponse<int>>> Create([FromBody] CustomerAddDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Müşteri oluşturuldu.", 201));

    [HttpPut("{id:int}")]
    [HasPermission(Permissions.CustomersUpdate)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] CustomerUpdateDto dto, CancellationToken ct)
    {
        dto.Id = id;
        await _service.UpdateAsync(dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Müşteri güncellendi."));
    }

    [HttpDelete("{id:int}")]
    [HasPermission(Permissions.CustomersDelete)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Müşteri silindi."));
    }
}
