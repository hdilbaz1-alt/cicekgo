using cicekgo_Core.Dto;
using cicekgo_Core.Entities;
using cicekgo_Core.Requests;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Data.Repositories
{
    public interface IOrderRepository
    {
        Task<IEnumerable<FullOrderDetailsDto>> GetViewLatestAsync(int take, string status = null);
        Task<Order> GetByOrderIdAsync(string orderId);
        Task<bool> UpdateAggregateByOrderIdAsync(OrderAggregateUpdateRequest req);
        Task<bool> OrderIdExistsAsync(string orderId);
        Task<int> CreateFullOrderAsync(FullOrderCreateRequest req);
        Task<FullOrderDetailsDto> GetViewByOrderIdAsync(string orderId);
    }
}
