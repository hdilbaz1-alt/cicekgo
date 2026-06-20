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
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;
    public OrdersController(IOrderService service) => _service = service;

    [HttpPost]
    [HasPermission(Permissions.OrdersCreate)]
    public async Task<ActionResult<ApiResponse<OrderCreateResultDto>>> Create([FromBody] OrderCreateDto dto, CancellationToken ct)
    {
        var result = await _service.CreateAsync(dto, ct);
        return Ok(ApiResponse<OrderCreateResultDto>.Ok(result, "Sipariş başarıyla oluşturuldu.", 201));
    }

    [HttpPost("list")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<object>>> List([FromBody] OrderListRequestDto request, CancellationToken ct)
    {
        var result = await _service.ListAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new
        {
            totalCount = result.TotalCount,
            page = result.Page,
            pageSize = result.PageSize,
            items = result.Items
        }));
    }

    // Kuryenin kendine atanmış siparişleri (servis zaten izinlere göre filtreler)
    [HttpPost("my-assigned")]
    [HasPermission(Permissions.OrdersViewOwn)]
    public async Task<ActionResult<ApiResponse<object>>> MyAssigned([FromBody] OrderListRequestDto request, CancellationToken ct)
    {
        var result = await _service.ListAsync(request, ct);
        return Ok(ApiResponse<object>.Ok(new
        {
            totalCount = result.TotalCount, page = result.Page, pageSize = result.PageSize, items = result.Items
        }));
    }

    [HttpGet("deleted")]
    [HasPermission(Permissions.OrdersViewDeleted)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DeletedOrderItemDto>>>> Deleted(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<DeletedOrderItemDto>>.Ok(await _service.ListDeletedAsync(ct)));

    /// <summary>Sipariş arama (kod / telefon / ad). nonCariOnly=true: cari hesabı olmayanlar.</summary>
    [HttpGet("search")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderListItemDto>>>> Search([FromQuery] string? q, [FromQuery] bool nonCariOnly, CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<OrderListItemDto>>.Ok(await _service.SearchAsync(q, nonCariOnly, ct)));

    [HttpGet("{orderCode}/ledger")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<OrderLedgerDto>>> Ledger(string orderCode, CancellationToken ct)
        => Ok(ApiResponse<OrderLedgerDto>.Ok(await _service.GetLedgerAsync(orderCode, ct)));

    [HttpPost("{orderCode}/pay")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<string>>> Pay(string orderCode, [FromBody] OrderPayInputDto dto, CancellationToken ct)
    {
        await _service.PayAsync(orderCode, dto, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Tahsilat kaydedildi.", 201));
    }

    [HttpPost("{orderCode}/refund")]
    [HasPermission(Permissions.FinanceCreatePayment)]
    public async Task<ActionResult<ApiResponse<string>>> Refund(string orderCode, [FromBody] OrderRefundInputDto dto, CancellationToken ct)
    {
        await _service.RefundAsync(orderCode, dto, ct);
        return Ok(ApiResponse<string>.Ok("ok", "İade kaydedildi.", 201));
    }

    [HttpGet("{orderCode}")]
    [HasPermission(Permissions.OrdersView)]
    public async Task<ActionResult<ApiResponse<OrderListItemDto>>> Detail(string orderCode, CancellationToken ct)
    {
        var o = await _service.GetByCodeAsync(orderCode, ct) ?? throw new NotFoundException("order not found");
        return Ok(ApiResponse<OrderListItemDto>.Ok(o));
    }

    [HttpPut("{orderCode}")]
    [HasPermission(Permissions.OrdersUpdate)]
    public async Task<ActionResult<ApiResponse<string>>> UpdateByCode(string orderCode, [FromBody] OrderUpdateDto dto, CancellationToken ct)
    {
        await _service.UpdateByCodeAsync(orderCode, dto, ct);
        return Ok(ApiResponse<string>.Ok("updated", "Sipariş başarıyla güncellendi."));
    }

    [HttpDelete("{orderCode}")]
    [HasPermission(Permissions.OrdersDelete)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(string orderCode, [FromBody] OrderDeleteDto? dto, CancellationToken ct)
    {
        await _service.DeleteByCodeAsync(orderCode, dto ?? new OrderDeleteDto(), ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Sipariş silindi."));
    }

    [HttpPost("{orderCode}/restore")]
    [HasPermission(Permissions.OrdersRestore)]
    public async Task<ActionResult<ApiResponse<string>>> Restore(string orderCode, CancellationToken ct)
    {
        await _service.RestoreByCodeAsync(orderCode, ct);
        return Ok(ApiResponse<string>.Ok("restored", "Sipariş geri yüklendi."));
    }

    [HttpPost("{orderCode}/assign-courier")]
    [HasPermission(Permissions.OrdersAssignCourier)]
    public async Task<ActionResult<ApiResponse<string>>> AssignCourier(string orderCode, [FromBody] AssignCourierDto dto, CancellationToken ct)
    {
        await _service.AssignCourierByCodeAsync(orderCode, dto, ct);
        return Ok(ApiResponse<string>.Ok("assigned", "Kurye atandı."));
    }

    [HttpPost("{orderCode}/change-status")]
    [HasPermission(Permissions.OrdersChangeStatus)]
    public async Task<ActionResult<ApiResponse<string>>> ChangeStatus(string orderCode, [FromBody] ChangeStatusDto dto, CancellationToken ct)
    {
        await _service.ChangeStatusByCodeAsync(orderCode, dto, ct);
        return Ok(ApiResponse<string>.Ok("status-changed", "Durum güncellendi."));
    }
}
