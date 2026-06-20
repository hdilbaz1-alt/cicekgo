using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Data.Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Business.Services.Implementations
{
    public class OrderCodeService : IOrderCodeService
    {
        private readonly IOrderCodeRepository _repo;

        public OrderCodeService(IOrderCodeRepository repo)
        {
            _repo = repo;
        }

        public Task<IEnumerable<OrderCodeDto>> GetAllAsync(CancellationToken ct = default) => _repo.GetAllAsync(ct);
        public Task<OrderCodeDto?> GetByIdAsync(int id, CancellationToken ct = default) => _repo.GetByIdAsync(id, ct);
        public Task<int> CreateAsync(OrderCodeCreateDto dto, CancellationToken ct = default) => _repo.CreateAsync(dto, ct);
        public Task<int> UpdateAsync(int id, OrderCodeUpdateDto dto, CancellationToken ct = default) => _repo.UpdateAsync(id, dto, ct);
        public Task<int> DeleteAsync(int id, CancellationToken ct = default) => _repo.DeleteAsync(id, ct);
    }
}
