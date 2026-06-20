using cicekgo.Core.Orders.Dtos;

namespace cicekgo.Business.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderCreateResultDto> CreateAsync(OrderCreateDto dto, CancellationToken ct = default);

        Task<(IEnumerable<OrderListItemDto> Items, int TotalCount)> ListOrdersAsync(
            DateTime startDate, DateTime endDate, int page, int pageSize, CancellationToken ct = default);

        // YALNIZCA BU VAR: Order kodu (TEST007 gibi) ile update
        Task UpdateByOrderCodeAsync(string orderCode, OrderUpdateDto dto, CancellationToken ct = default);
    }
}
