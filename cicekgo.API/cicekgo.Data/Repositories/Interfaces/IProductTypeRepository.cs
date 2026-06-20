using cicekgo.Core.Orders.Dtos;

namespace cicekgo.Data.Repositories.Interfaces;

public interface IProductTypeRepository
{
    Task<IEnumerable<ProductTypeDto>> GetAllAsync(CancellationToken ct = default);
    Task<ProductTypeDto?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> AddAsync(ProductTypeAddRequest request, string createdBy, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, ProductTypeUpdateRequest request, string updatedBy, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}
