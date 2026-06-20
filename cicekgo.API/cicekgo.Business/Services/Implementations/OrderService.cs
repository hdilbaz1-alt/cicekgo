using cicekgo.Business.Common.Interfaces;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Orders.Dtos;
using cicekgo.Core.Customers.Dtos;
using cicekgo.Data.Repositories.Interfaces;

namespace cicekgo.Business.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;
        private readonly ICustomerService _customerService;
        private readonly ICurrentUser _current;

        public OrderService(IOrderRepository repo, ICustomerService customerService, ICurrentUser current)
        {
            _repo = repo;
            _customerService = customerService;
            _current = current;
        }

        public async Task<OrderCreateResultDto> CreateAsync(OrderCreateDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(dto.OrderId))
                throw new ArgumentException("OrderId is required.");

            var createdBy = _current.UserName ?? "unknown"; // JWT'den kullanıcı adı
            var orderPkId = await _repo.CreateOrderAggregateAsync(dto, createdBy, ct);

            // Sipariş oluşturulduğunda cari hesaba kayıt ekle
            System.Diagnostics.Debug.WriteLine($"DEBUG: SenderName={dto.SenderName}, SenderPhone={dto.SenderPhone}");
            System.Diagnostics.Debug.WriteLine($"DEBUG: OrderAmount={dto.OrderAmount}, OrderRemainingAmount={dto.OrderRemainingAmount}");
            System.Diagnostics.Debug.WriteLine($"DEBUG: RecipientName={dto.RecipientName}, RecipientAddress={dto.RecipientAddress}");
            System.Diagnostics.Debug.WriteLine($"DEBUG: OrderId={dto.OrderId}");
            
            // Müşteri tablosunda var mı kontrol et (SenderName ve SenderPhone ile)
            if (!string.IsNullOrEmpty(dto.SenderName) && !string.IsNullOrEmpty(dto.SenderPhone) && dto.OrderAmount.HasValue && dto.OrderAmount > 0)
            {
                try
                {
                    // Müşteri tablosunda var mı kontrol et
                    var customerId = await _customerService.GetCustomerIdByNameAndPhoneAsync(dto.SenderName, dto.SenderPhone, ct);
                    if (!customerId.HasValue)
                    {
                        System.Diagnostics.Debug.WriteLine($"DEBUG: Müşteri tablosunda bulunamadı: SenderName={dto.SenderName}, SenderPhone={dto.SenderPhone}");
                        // Müşteri tablosunda yoksa cari hesaba kayıt ekleme
                        return new OrderCreateResultDto
                        {
                            OrderPkId = orderPkId,
                            OrderId = dto.OrderId
                        };
                    }

                    var orderAmount = dto.OrderAmount ?? 0;
                    var remainingAmount = dto.OrderRemainingAmount ?? 0;
                    var paidAmount = orderAmount - remainingAmount; // Ödenen tutar (sipariş tutarı - kalan tutar)
                    
                    System.Diagnostics.Debug.WriteLine($"DEBUG: orderAmount={orderAmount}, remainingAmount={remainingAmount}, paidAmount={paidAmount}");
                    
                    // Alıcı bilgilerini CustomerNote'a yaz: recipientName - recipientAddress
                    var recipientInfo = "";
                    if (!string.IsNullOrEmpty(dto.RecipientName) || !string.IsNullOrEmpty(dto.RecipientAddress))
                    {
                        var name = dto.RecipientName ?? "";
                        var address = dto.RecipientAddress ?? "";
                        recipientInfo = string.IsNullOrEmpty(address) ? name : $"{name} - {address}";
                    }

                    System.Diagnostics.Debug.WriteLine($"DEBUG: recipientInfo={recipientInfo}");

                    var ledgerDto = new CustomerLedgerAddDto
                    {
                        CustomerId = customerId.Value,
                        TransactionType = "ORDER",
                        Description = dto.CustomerNote ?? $"Sipariş - {dto.OrderId}",
                        Debit = (decimal)orderAmount, // Debit = orderAmount (sipariş tutarı)
                        Credit = (decimal)paidAmount, // Credit = orderAmount - orderRemainingAmount (ödenen tutar)
                        ReferenceId = orderPkId,
                        ReferenceType = "ORDER",
                        OrderCode = dto.OrderId, // OrderCode = orderId (sipariş kodu)
                        CustomerNote = recipientInfo // CustomerNote = recipientName - recipientAddress
                    };

                    System.Diagnostics.Debug.WriteLine($"DEBUG: ledgerDto.OrderCode={ledgerDto.OrderCode}, ledgerDto.CustomerNote={ledgerDto.CustomerNote}");
                    System.Diagnostics.Debug.WriteLine($"DEBUG: ledgerDto.Debit={ledgerDto.Debit}, ledgerDto.Credit={ledgerDto.Credit}");

                    await _customerService.AddLedgerEntryAsync(ledgerDto, createdBy, ct);
                    System.Diagnostics.Debug.WriteLine("DEBUG: CustomerLedger kayıt başarıyla eklendi!");
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"DEBUG: CustomerLedger kayıt hatası: {ex.Message}");
                    System.Diagnostics.Debug.WriteLine($"DEBUG: Stack trace: {ex.StackTrace}");
                    // Cari kayıt eklenemezse siparişi iptal etme, sadece log
                    // Gerçek uygulamada burada logging yapılabilir
                }
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"DEBUG: CustomerLedger kayıt koşulları sağlanmıyor!");
                System.Diagnostics.Debug.WriteLine($"DEBUG: CustomerId.HasValue={dto.CustomerId.HasValue}");
                System.Diagnostics.Debug.WriteLine($"DEBUG: OrderAmount.HasValue={dto.OrderAmount.HasValue}");
                System.Diagnostics.Debug.WriteLine($"DEBUG: OrderAmount={dto.OrderAmount}");
            }

            return new OrderCreateResultDto
            {
                OrderPkId = orderPkId,
                OrderId = dto.OrderId
            };
        }

        public async Task<(IEnumerable<OrderListItemDto> Items, int TotalCount)> ListOrdersAsync(
            DateTime startDate, DateTime endDate, int page, int pageSize, CancellationToken ct = default)
            => await _repo.ListOrdersAsync(startDate, endDate, page, pageSize, ct);

        public async Task UpdateByOrderCodeAsync(string orderCode, OrderUpdateDto dto, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(orderCode))
                throw new ArgumentException("orderCode is required.");

            var updatedBy = _current.UserName ?? "unknown"; // JWT'den kullanıcı adı
            await _repo.UpdateOrderAggregateByCodeAsync(orderCode, dto, updatedBy, ct);

            // Sipariş güncellemesinde ledger kaydı oluşturulmaz
            // Ledger kaydı sadece sipariş oluştururken ve ödeme eklerken oluşturulur
        }
    }
}
