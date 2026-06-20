using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Orders.Dtos;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Business.Services.Implementations;

public class ProductTypeService : IProductTypeService
{
    private readonly IProductTypeRepository _repo;

    public ProductTypeService(IProductTypeRepository repo)
    {
        _repo = repo;
    }

    public Task<IEnumerable<ProductTypeDto>> GetAllAsync(CancellationToken ct = default) => _repo.GetAllAsync(ct);
    public Task<ProductTypeDto?> GetByIdAsync(int id, CancellationToken ct = default) => _repo.GetByIdAsync(id, ct);
    public Task<int> AddAsync(ProductTypeAddRequest request, string createdBy, CancellationToken ct = default) => _repo.AddAsync(request, createdBy, ct);
    public Task<bool> UpdateAsync(int id, ProductTypeUpdateRequest request, string updatedBy, CancellationToken ct = default) => _repo.UpdateAsync(id, request, updatedBy, ct);
    public Task<bool> DeleteAsync(int id, CancellationToken ct = default) => _repo.DeleteAsync(id, ct);
}
