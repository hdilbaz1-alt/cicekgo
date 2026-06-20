using cicekgo.Core.Customers.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Business.Services.Interfaces
{
    public interface IOrderCodeService
    {
        Task<IEnumerable<OrderCodeDto>> GetAllAsync(CancellationToken ct = default);
        Task<OrderCodeDto?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<int> CreateAsync(OrderCodeCreateDto dto, CancellationToken ct = default);
        Task<int> UpdateAsync(int id, OrderCodeUpdateDto dto, CancellationToken ct = default);
        Task<int> DeleteAsync(int id, CancellationToken ct = default);
    }
}
