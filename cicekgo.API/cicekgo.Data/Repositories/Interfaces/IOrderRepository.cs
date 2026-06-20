using cicekgo.Core.Orders.Dtos;

namespace cicekgo.Data.Repositories.Interfaces
{
    public interface IOrderRepository
    {
        Task<int> CreateOrderAggregateAsync(OrderCreateDto dto, string createdUser, CancellationToken ct = default);

        Task<(IEnumerable<OrderListItemDto> Items, int TotalCount)> ListOrdersAsync(
            DateTime startDate, DateTime endDate, int page, int pageSize, CancellationToken ct = default);

        // YALNIZCA BU VAR: Order kodu (TEST007 gibi) ile update
        Task UpdateOrderAggregateByCodeAsync(
            string orderCode, OrderUpdateDto dto, string updatedBy, CancellationToken ct = default);
    }
}
