using CicekGo.Application.Common;

namespace CicekGo.Application.Orders;

public interface IOrderService
{
    Task<OrderCreateResultDto> CreateAsync(OrderCreateDto dto, CancellationToken ct = default);
    Task<PagedResult<OrderListItemDto>> ListAsync(OrderListRequestDto request, CancellationToken ct = default);
    Task<IReadOnlyList<OrderListItemDto>> SearchAsync(string? query, bool nonCariOnly, CancellationToken ct = default);
    Task<OrderLedgerDto> GetLedgerAsync(string orderCode, CancellationToken ct = default);
    Task PayAsync(string orderCode, OrderPayInputDto dto, CancellationToken ct = default);
    Task RefundAsync(string orderCode, OrderRefundInputDto dto, CancellationToken ct = default);
    Task<OrderListItemDto?> GetByCodeAsync(string orderCode, CancellationToken ct = default);
    Task UpdateByCodeAsync(string orderCode, OrderUpdateDto dto, CancellationToken ct = default);
    Task DeleteByCodeAsync(string orderCode, OrderDeleteDto dto, CancellationToken ct = default);
    Task RestoreByCodeAsync(string orderCode, CancellationToken ct = default);
    Task<IReadOnlyList<DeletedOrderItemDto>> ListDeletedAsync(CancellationToken ct = default);
    Task AssignCourierByCodeAsync(string orderCode, AssignCourierDto dto, CancellationToken ct = default);
    Task ChangeStatusByCodeAsync(string orderCode, ChangeStatusDto dto, CancellationToken ct = default);
}

// ---- Order codes ----
public class OrderCodeDto
{
    public int Id { get; set; }
    public string OrderStartCode { get; set; } = default!;
    public string OrderLastCode { get; set; } = default!;
}

public class OrderCodeCreateDto
{
    public string OrderStartCode { get; set; } = default!;
    public string? OrderLastCode { get; set; }
}

public class OrderCodeUpdateDto
{
    public string OrderStartCode { get; set; } = default!;
    public string? OrderLastCode { get; set; }
}

public interface IOrderCodeService
{
    Task<IReadOnlyList<OrderCodeDto>> GetAllAsync(CancellationToken ct = default);
    Task<int> CreateAsync(OrderCodeCreateDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, OrderCodeUpdateDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}

// ---- Order statuses ----
public class OrderStatusDto
{
    public int Id { get; set; }
    public string StatusName { get; set; } = default!;
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsSystem { get; set; }
}

public class OrderStatusAddRequest { public string StatusName { get; set; } = default!; public string? Color { get; set; } }
public class OrderStatusUpdateRequest { public string StatusName { get; set; } = default!; public string? Color { get; set; } }
public class OrderStatusReorderRequest { public List<int> Ids { get; set; } = new(); }

public interface IOrderStatusService
{
    Task<IReadOnlyList<OrderStatusDto>> GetAllAsync(CancellationToken ct = default);
    Task<int> AddAsync(OrderStatusAddRequest request, CancellationToken ct = default);
    Task UpdateAsync(int id, OrderStatusUpdateRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task ReorderAsync(OrderStatusReorderRequest request, CancellationToken ct = default);
}

// ---- Product types ----
public class ProductTypeDto
{
    public int Id { get; set; }
    public string ProductName { get; set; } = default!;
}

public class ProductTypeAddRequest { public string ProductName { get; set; } = default!; }
public class ProductTypeUpdateRequest { public string ProductName { get; set; } = default!; }

public interface IProductTypeService
{
    Task<IReadOnlyList<ProductTypeDto>> GetAllAsync(CancellationToken ct = default);
    Task<int> AddAsync(ProductTypeAddRequest request, CancellationToken ct = default);
    Task UpdateAsync(int id, ProductTypeUpdateRequest request, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
}
