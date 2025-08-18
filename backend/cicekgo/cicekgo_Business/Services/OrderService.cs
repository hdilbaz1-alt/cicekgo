using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using cicekgo_Data;
using cicekgo_Core.Dto;         // FullOrderDetailsDto
using cicekgo_Core.Requests;    // FullOrderCreateRequest, OrderAggregateUpdateRequest
using cicekgo_Data.Repositories;

namespace cicekgo_Business.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;

        private static readonly string[] AllowedStatuses =
            { "Beklemede", "Onaylandı", "Teslimatta", "Teslim Edildi" };

        public OrderService(IOrderRepository repo)
        {
            _repo = repo;
        }

        // VIEW → tek kayıt
        public Task<FullOrderDetailsDto> GetViewByOrderIdAsync(string orderId)
        {
            return _repo.GetViewByOrderIdAsync(orderId);
        }

        // VIEW → son N kayıt (opsiyonel duruma göre)
        public Task<IEnumerable<FullOrderDetailsDto>> GetViewLatestAsync(int take, string status = null)
        {
            return _repo.GetViewLatestAsync(take, status);
        }

        // PUT (Order_Id ile aggregate update)
        public async Task<bool> UpdateAggregateByOrderIdAsync(OrderAggregateUpdateRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Order_Id))
                throw new ArgumentException("Order_Id zorunlu.");

            if (!string.IsNullOrWhiteSpace(req.Order_Status) &&
                Array.IndexOf(AllowedStatuses, req.Order_Status) < 0)
                throw new ArgumentException("Order_Status geçersiz. (Beklemede/Onaylandı/Teslimatta/Teslim Edildi)");

            return await _repo.UpdateAggregateByOrderIdAsync(req);
        }

        // POST (Orders + bağlı tablolar, transaction’lı)
        public async Task<int> CreateFullOrderAsync(FullOrderCreateRequest req)
        {
            if (req == null) throw new ArgumentNullException(nameof(req));

            if (string.IsNullOrWhiteSpace(req.Order_Id))
                throw new ArgumentException("Order_Id zorunlu.");

            if (string.IsNullOrWhiteSpace(req.Order_Status) ||
                Array.IndexOf(AllowedStatuses, req.Order_Status) < 0)
                throw new ArgumentException("Order_Status geçersiz. (Beklemede/Onaylandı/Teslimatta/Teslim Edildi)");

            // Remaining yoksa ödemelerden hesapla
            if (!req.Order_RemainingAmount.HasValue && req.Order_Amount.HasValue &&
                req.Payments != null && req.Payments.Any())
            {
                decimal paid = 0m;
                foreach (var p in req.Payments)
                    paid += p.Amount;

                var remaining = (decimal)req.Order_Amount.Value - paid;
                if (remaining < 0) remaining = 0;
                req.Order_RemainingAmount = (double)remaining;
            }

            if (await _repo.OrderIdExistsAsync(req.Order_Id))
                throw new ArgumentException("Order_Id zaten var.");

            return await _repo.CreateFullOrderAsync(req);
        }
    }
}
