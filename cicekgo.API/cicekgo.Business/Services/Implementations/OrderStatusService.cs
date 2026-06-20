using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Orders.Dtos;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Business.Services.Implementations;

public class OrderStatusService : IOrderStatusService
{
    private readonly IOrderStatusRepository _repo;

    public OrderStatusService(IOrderStatusRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<OrderStatusDto>> GetAllAsync(CancellationToken ct = default) => _repo.GetAllAsync(ct);
    public Task<OrderStatusDto?> GetByIdAsync(int id, CancellationToken ct = default) => _repo.GetByIdAsync(id, ct);
    public Task<int> AddAsync(OrderStatusAddRequest request, string createdBy, CancellationToken ct = default) => _repo.AddAsync(request, createdBy, ct);
    public Task<bool> UpdateAsync(int id, OrderStatusUpdateRequest request, string updatedBy, CancellationToken ct = default) => _repo.UpdateAsync(id, request, updatedBy, ct);
    public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => _repo.DeleteAsync(id, ct);
}
