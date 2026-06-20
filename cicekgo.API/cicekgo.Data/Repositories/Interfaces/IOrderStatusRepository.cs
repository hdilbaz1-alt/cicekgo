using cicekgo.Core.Orders.Dtos;

namespace cicekgo.Data.Repositories.Interfaces;

public interface IOrderStatusRepository
{
    Task<IEnumerable<OrderStatusDto>> GetAllAsync(CancellationToken ct = default);
    Task<OrderStatusDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> AddAsync(OrderStatusAddRequest request, string createdBy, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, OrderStatusUpdateRequest request, string updatedBy, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
