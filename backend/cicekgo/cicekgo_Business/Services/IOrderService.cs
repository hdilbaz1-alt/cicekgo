using cicekgo_Core.Dto;
using cicekgo_Core.Entities;
using cicekgo_Core.Requests;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Business.Services
{
    public interface IOrderService
    {

        Task<FullOrderDetailsDto>GetViewByOrderIdAsync(string orderId);
        Task<IEnumerable<FullOrderDetailsDto>> GetViewLatestAsync(int take, string status = null);
        Task<int> CreateFullOrderAsync(FullOrderCreateRequest req);
        Task<bool> UpdateAggregateByOrderIdAsync(OrderAggregateUpdateRequest req);
    }
}
