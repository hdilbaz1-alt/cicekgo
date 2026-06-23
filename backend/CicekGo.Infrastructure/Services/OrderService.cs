using System.Globalization;
using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Notifications;
using CicekGo.Application.Orders;
using CicekGo.Domain.Authorization;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IAuditLogger _audit;
    private readonly MasterDbContext _master;
    private readonly IPushNotificationService _push;
    private readonly Application.Email.IEmailDispatcher _email;

    public OrderService(TenantDbContext db, ICurrentUser current, IAuditLogger audit, MasterDbContext master, IPushNotificationService push, Application.Email.IEmailDispatcher email)
    {
        _db = db;
        _current = current;
        _audit = audit;
        _master = master;
        _push = push;
        _email = email;
    }

    /// <summary>Atanan kuryeye "yeni sipariş" push bildirimi (commit sonrası, hata yutulur).</summary>
    private async Task NotifyCourierAsync(int courierUserId, string orderCode, string? recipient, CancellationToken ct)
    {
        try
        {
            await _push.SendToUserAsync(courierUserId, new NotificationPayload
            {
                Title = "Yeni siparişin var! 🌸",
                Body = string.IsNullOrWhiteSpace(recipient) ? $"Sipariş {orderCode}" : $"{orderCode} · {recipient}",
                Url = $"/?go=order&code={Uri.EscapeDataString(orderCode)}",
                Tag = $"order-{orderCode}"
            }, ct);
        }
        catch { /* bildirim sipariş akışını bozmaz */ }
    }

    /// <summary>assignedCourierId'leri master DB'den isimle eşler.</summary>
    private async Task ResolveCourierNamesAsync(IEnumerable<OrderListItemDto> items, CancellationToken ct)
    {
        var ids = items.Where(i => i.AssignedCourierId.HasValue).Select(i => i.AssignedCourierId!.Value).Distinct().ToList();
        if (ids.Count == 0) return;
        // FullName boş string olabilir (null değil) → ?? yetmez; boş/whitespace ise kullanıcı adına düş
        var rows = await _master.Users.AsNoTracking().Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Username }).ToListAsync(ct);
        var names = rows.ToDictionary(u => u.Id, u => string.IsNullOrWhiteSpace(u.FullName) ? u.Username : u.FullName!);
        foreach (var it in items)
            if (it.AssignedCourierId.HasValue && names.TryGetValue(it.AssignedCourierId.Value, out var n))
                it.AssignedCourierName = n;
    }

    private string? User => _current.Username;

    public async Task<OrderCreateResultDto> CreateAsync(OrderCreateDto dto, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var code = string.IsNullOrWhiteSpace(dto.OrderId)
            ? await GenerateCodeAsync(ct)
            : dto.OrderId!.Trim();

        if (await _db.Orders.AnyAsync(o => o.Code == code, ct))
            throw new ConflictException($"order code already exists: {code}");

        var status = dto.OrderStatus ?? "Yeni";
        var order = new Order
        {
            Code = code,
            Status = status,
            Source = dto.Source,
            DeliveryTimeRange = dto.DeliveryTimeRange,
            ProductType = dto.OrderProductType,
            DeliveryDate = dto.OrderDeliveryDate,
            DiscountTotal = dto.DiscountTotal ?? 0m,
            DeliveryFee = dto.DeliveryFee ?? 0m,
            ExtraFee = dto.ExtraFee ?? 0m,
            CustomerId = dto.CustomerId,
            AssignedCourierId = dto.AssignedCourierId,
            IsNotified = dto.IsNotified ?? false,
            SenderName = dto.SenderName ?? dto.OrderSender,
            SenderPhone = dto.SenderPhone,
            SenderEmail = dto.SenderEmail,
            RecipientName = dto.RecipientName ?? dto.OrderTo,
            RecipientPhone = dto.RecipientPhone,
            RecipientEmail = dto.RecipientEmail,
            RecipientCity = dto.RecipientCity,
            RecipientDistrict = dto.RecipientDistrict,
            RecipientAddressLine = dto.RecipientAddressLine,
            RecipientAddress = AddressFormatter.HasStructured(dto.RecipientAddressLine, dto.RecipientDistrict, dto.RecipientCity)
                ? AddressFormatter.FormatFull(dto.RecipientAddressLine, dto.RecipientDistrict, dto.RecipientCity)
                : dto.RecipientAddress,
            ExtraNote = dto.ExtraNote,
            CardNote = dto.CardNote,
            CustomerNote = dto.CustomerNote,
            DeliveryNote = dto.DeliveryNote,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User,
            CreatedByUserId = _current.UserId
        };

        // Kalemler
        decimal subTotal = 0m;
        if (dto.Items is { Count: > 0 })
        {
            var productIds = dto.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
            var prods = await _db.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
            foreach (var it in dto.Items)
            {
                var lineTotal = Math.Max(0m, it.Quantity * it.UnitPrice - it.Discount);
                subTotal += lineTotal;
                var tracked = it.ProductId.HasValue && prods.TryGetValue(it.ProductId.Value, out var pr) && pr.TrackStock;
                order.Items.Add(new OrderItem
                {
                    ProductId = it.ProductId,
                    ProductName = string.IsNullOrWhiteSpace(it.ProductName) && it.ProductId.HasValue && prods.ContainsKey(it.ProductId.Value)
                        ? prods[it.ProductId.Value].Name : it.ProductName,
                    Quantity = it.Quantity,
                    UnitPrice = it.UnitPrice,
                    Discount = it.Discount,
                    TotalPrice = lineTotal,
                    IsStockTracked = tracked
                });
                if (tracked) await ApplyStockDeltaAsync(prods[it.ProductId!.Value], -it.Quantity, code, "ORDER_OUT", ct);
            }
        }
        else
        {
            // Geriye dönük: kalem yoksa tek tutar
            subTotal = dto.OrderAmount ?? 0m;
        }

        order.SubTotal = subTotal;
        order.Amount = Math.Max(0m, subTotal - order.DiscountTotal + order.DeliveryFee + order.ExtraFee);

        var paymentsTotal = dto.Payments?.Sum(p => p.PaymentAmount) ?? 0m;
        order.RemainingAmount = dto.OrderRemainingAmount ?? Math.Max(0m, order.Amount - paymentsTotal);
        order.PaymentStatus = dto.PaymentStatus ?? ComputePaymentStatus(order.Amount, paymentsTotal);

        if (dto.Payments is { Count: > 0 })
        {
            var validPm = await ValidPaymentMethodIdsAsync(ct);
            foreach (var p in dto.Payments)
                order.Payments.Add(new OrderPayment
                {
                    Amount = p.PaymentAmount,
                    PaymentMethodId = NormalizePm(p.PaymentMethodId, validPm),
                    PaidAt = p.PaymentDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = User
                });
        }

        order.StatusHistory.Add(new OrderStatusHistory
        {
            Status = status, ChangedByUserId = _current.UserId, ChangedByUserName = User, ChangedAt = DateTime.UtcNow
        });

        _db.Orders.Add(order);
        await _db.SaveChangesAsync(ct);

        // Cari & kasa otomatik kayıtları
        if (order.CustomerId.HasValue)
        {
            await PostLedgerAsync(order.CustomerId.Value, "ORDER", order.Amount, 0m, "ORDER", order.Id, order.Code, "Sipariş oluşturuldu", ct);
            if (paymentsTotal > 0)
                await PostLedgerAsync(order.CustomerId.Value, "PAYMENT", 0m, paymentsTotal, "ORDER_PAYMENT", order.Id, order.Code, "Sipariş ödemesi", ct);
        }
        if (paymentsTotal > 0)
        {
            var pmId = dto.Payments?.FirstOrDefault()?.PaymentMethodId ?? 0;
            var pmName = pmId > 0 ? await _db.PaymentMethods.Where(p => p.Id == pmId).Select(p => p.Name).FirstOrDefaultAsync(ct) : null;
            PostCash("COLLECTION", "IN", paymentsTotal, order.Id, order.CustomerId, pmName, $"Sipariş {order.Code} tahsilat");
            await _db.SaveChangesAsync(ct);
        }

        await tx.CommitAsync(ct);

        await _audit.LogAsync("CREATE", "Orders", "Order", order.Id.ToString(),
            $"Sipariş oluşturuldu: {order.Code}", ct: ct);

        // Atanmış kurye varsa anlık bildirim (commit sonrası)
        if (order.AssignedCourierId.HasValue)
            await NotifyCourierAsync(order.AssignedCourierId.Value, order.Code, order.RecipientName, ct);

        return new OrderCreateResultDto { OrderPkId = order.Id, OrderCode = order.Code };
    }

    private static string ComputePaymentStatus(decimal grand, decimal paid)
        => paid <= 0 ? "Ödenmedi" : paid >= grand ? "Ödendi" : "Kısmi";

    // ===== Cari / kasa otomatik kayıtları =====
    private async Task<decimal> CustomerBalanceAsync(int customerId, CancellationToken ct)
    {
        var deb = await _db.CustomerLedger.Where(l => l.CustomerId == customerId).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
        var cre = await _db.CustomerLedger.Where(l => l.CustomerId == customerId).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
        return deb - cre;
    }

    private async Task PostLedgerAsync(int customerId, string type, decimal debit, decimal credit,
        string? refType, int? orderId, string? orderCode, string? desc, CancellationToken ct)
    {
        var bal = await CustomerBalanceAsync(customerId, ct) + debit - credit;
        _db.CustomerLedger.Add(new CustomerLedgerEntry
        {
            CustomerId = customerId, TransactionDate = DateTime.UtcNow, TransactionType = type,
            Debit = debit, Credit = credit, Balance = bal, ReferenceType = refType,
            OrderId = orderId, OrderCode = orderCode, Description = desc,
            CreatedBy = User, CreatedByUserId = _current.UserId, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
    }

    private void PostCash(string movementType, string direction, decimal amount, int? orderId, int? customerId, string? method, string? desc)
    {
        if (amount <= 0) return;
        _db.CashMovements.Add(new CashMovement
        {
            MovementType = movementType, Direction = direction, Amount = amount,
            OrderId = orderId, CustomerId = customerId, PaymentMethod = method, Description = desc,
            TransactionDate = DateTime.UtcNow, CreatedByUserId = _current.UserId, CreatedByUserName = User, CreatedAt = DateTime.UtcNow
        });
    }

    /// <summary>Sipariş kalemlerinin stoğunu iade eder (silme) veya tekrar düşer (geri yükleme).</summary>
    private async Task ReturnOrDeductItemStockAsync(Order order, bool returnStock, CancellationToken ct)
    {
        var ids = order.Items.Where(i => i.IsStockTracked && i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
        if (ids.Count == 0) return;
        var prods = await _db.Products.Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
        foreach (var it in order.Items)
            if (it.IsStockTracked && it.ProductId.HasValue && prods.TryGetValue(it.ProductId.Value, out var p))
                await ApplyStockDeltaAsync(p, returnStock ? it.Quantity : -it.Quantity, order.Code,
                    returnStock ? "ORDER_RETURN" : "ORDER_OUT", ct);
    }

    /// <summary>Ürün stoğunu delta kadar değiştirir ve hareket kaydı oluşturur (negatif stoğa izin verir).</summary>
    private async Task ApplyStockDeltaAsync(Product product, decimal delta, string? orderCode, string type, CancellationToken ct)
    {
        if (delta == 0) return;
        var prev = product.CurrentStock;
        product.CurrentStock = prev + delta;
        _db.StockMovements.Add(new StockMovement
        {
            ProductId = product.Id,
            MovementType = type,
            Quantity = Math.Abs(delta),
            PreviousStock = prev,
            NewStock = product.CurrentStock,
            Description = orderCode is null ? null : $"Sipariş {orderCode}",
            CreatedByUserId = _current.UserId,
            CreatedByUserName = User,
            CreatedAt = DateTime.UtcNow
        });
    }

    private static readonly System.Linq.Expressions.Expression<Func<Order, OrderListItemDto>> Projection = o => new OrderListItemDto
    {
        OrderPkId = o.Id,
        OrderCode = o.Code,
        OrderStatus = o.Status,
        ProductType = o.ProductType,
        CreatedDate = o.CreatedAt,
        DeliveryDate = o.DeliveryDate,
        CreatedUser = o.CreatedBy,
        SenderName = o.SenderName,
        SenderPhone = o.SenderPhone,
        SenderEmail = o.SenderEmail,
        RecipientName = o.RecipientName,
        RecipientPhone = o.RecipientPhone,
        RecipientEmail = o.RecipientEmail,
        RecipientAddress = o.RecipientAddress,
        RecipientCity = o.RecipientCity,
        RecipientDistrict = o.RecipientDistrict,
        RecipientAddressLine = o.RecipientAddressLine,
        TotalPaid = o.Payments.Sum(p => (decimal?)p.Amount) ?? 0m,
        LastPaymentDate = o.Payments.Max(p => (DateTime?)p.PaidAt),
        OrderAmount = o.Amount,
        OrderRemainingAmount = o.RemainingAmount,
        IsNotified = o.IsNotified,
        CustomerId = o.CustomerId,
        ExtraNote = o.ExtraNote,
        CardNote = o.CardNote,
        CustomerNote = o.CustomerNote,
        SubTotal = o.SubTotal,
        DiscountTotal = o.DiscountTotal,
        DeliveryFee = o.DeliveryFee,
        ExtraFee = o.ExtraFee,
        Source = o.Source,
        // Kalan 0 ise "Kısmi" görünmesin → "Ödendi" (geriye dönük görüntü düzeltmesi)
        PaymentStatus = (o.RemainingAmount <= 0.001m && o.Amount > 0m && o.PaymentStatus == "Kısmi") ? "Ödendi" : o.PaymentStatus,
        DeliveryTimeRange = o.DeliveryTimeRange,
        AssignedCourierId = o.AssignedCourierId,
        DeliveryNote = o.DeliveryNote,
        Items = o.Items.Select(i => new OrderItemDto
        {
            Id = i.Id, ProductId = i.ProductId, ProductName = i.ProductName,
            Quantity = i.Quantity, UnitPrice = i.UnitPrice, Discount = i.Discount, TotalPrice = i.TotalPrice
        }).ToList()
    };

    public async Task<OrderListItemDto?> GetByCodeAsync(string orderCode, CancellationToken ct = default)
    {
        var dto = await _db.Orders.AsNoTracking().Where(o => o.Code == orderCode).Select(Projection).FirstOrDefaultAsync(ct);
        if (dto is null) return null;
        if (!_current.HasPermission(Permissions.OrdersViewAll) && _current.HasPermission(Permissions.OrdersViewOwn)
            && dto.AssignedCourierId != _current.UserId)
            throw new ForbiddenException("Bu sipariş size atanmamış.");
        await ResolveCourierNamesAsync(new[] { dto }, ct);
        return dto;
    }

    public async Task<PagedResult<OrderListItemDto>> ListAsync(OrderListRequestDto request, CancellationToken ct = default)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch { < 1 => 50, > 500 => 500, _ => request.PageSize };

        var query = _db.Orders.AsNoTracking().AsQueryable();

        if (request.CustomerId.HasValue)
        {
            // Müşteri bazlı (tahsilat seçici): tarih filtresi uygulanmaz
            query = query.Where(o => o.CustomerId == request.CustomerId.Value);
        }
        else
        {
            var (start, endExclusive) = ParseDateRange(request.StartDate, request.EndDate);
            query = query.Where(o => o.DeliveryDate >= start && o.DeliveryDate < endExclusive);
        }

        // Kurye izolasyonu: OrdersViewAll yoksa ama OrdersViewOwn varsa yalnız kendi atanmışları
        if (!_current.HasPermission(Permissions.OrdersViewAll) && _current.HasPermission(Permissions.OrdersViewOwn))
        {
            var uid = _current.UserId;
            query = query.Where(o => o.AssignedCourierId == uid);
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(o => o.DeliveryDate).ThenByDescending(o => o.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(Projection)
            .ToListAsync(ct);

        await ResolveCourierNamesAsync(items, ct);

        return new PagedResult<OrderListItemDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        };
    }

    public async Task<IReadOnlyList<OrderListItemDto>> SearchAsync(string? query, bool nonCariOnly, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().AsQueryable();
        if (nonCariOnly) q = q.Where(o => o.CustomerId == null);
        var s = string.IsNullOrWhiteSpace(query) ? null : query.Trim();
        if (s is not null)
        {
            var like = $"%{s}%";
            q = q.Where(o => EF.Functions.ILike(o.Code, like)
                || (o.RecipientPhone != null && EF.Functions.ILike(o.RecipientPhone, like))
                || (o.SenderPhone != null && EF.Functions.ILike(o.SenderPhone, like))
                || (o.RecipientName != null && EF.Functions.ILike(o.RecipientName, like))
                || (o.SenderName != null && EF.Functions.ILike(o.SenderName, like)));
        }
        var items = await q.OrderByDescending(o => o.CreatedAt).Take(100).Select(Projection).ToListAsync(ct);
        await ResolveCourierNamesAsync(items, ct);
        return items;
    }

    private async Task<string?> PmNameAsync(int? id, CancellationToken ct) =>
        id.HasValue && id.Value > 0 ? await _db.PaymentMethods.Where(p => p.Id == id.Value).Select(p => p.Name).FirstOrDefaultAsync(ct) : null;

    public async Task<OrderLedgerDto> GetLedgerAsync(string orderCode, CancellationToken ct = default)
    {
        var order = await _db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");
        var paid = await _db.OrderPayments.Where(p => p.OrderId == order.Id).SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
        var moves = await _db.CashMovements.AsNoTracking().Where(c => c.OrderId == order.Id)
            .OrderByDescending(c => c.TransactionDate).ThenByDescending(c => c.Id)
            .Select(c => new OrderMovementDto
            {
                Id = c.Id, Date = c.TransactionDate, MovementType = c.MovementType, Direction = c.Direction,
                Amount = c.Amount, PaymentMethod = c.PaymentMethod, Description = c.Description
            }).ToListAsync(ct);
        return new OrderLedgerDto
        {
            OrderCode = order.Code, CustomerId = order.CustomerId,
            RecipientName = order.RecipientName, RecipientPhone = order.RecipientPhone,
            SenderName = order.SenderName, SenderPhone = order.SenderPhone,
            Status = order.Status, Amount = order.Amount, Paid = paid, Remaining = order.RemainingAmount,
            Movements = moves
        };
    }

    public async Task PayAsync(string orderCode, OrderPayInputDto dto, CancellationToken ct = default)
    {
        if (dto.Amount <= 0) throw new AppException("Geçerli bir tutar girin.");
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        var newRemaining = order.RemainingAmount - dto.Amount;
        if (newRemaining < -0.001m) throw new AppException("Tutar kalan tutardan fazla olamaz.");
        order.RemainingAmount = Math.Max(0m, newRemaining);
        order.UpdatedAt = DateTime.UtcNow; order.UpdatedBy = User;

        var pmId = dto.PaymentMethodId;
        if (pmId.HasValue && (pmId.Value <= 0 || !await _db.PaymentMethods.AnyAsync(p => p.Id == pmId.Value, ct))) pmId = null;
        _db.OrderPayments.Add(new OrderPayment { OrderId = order.Id, Amount = dto.Amount, PaymentMethodId = pmId, PaidAt = dto.PaymentDate ?? DateTime.UtcNow, CreatedAt = DateTime.UtcNow, CreatedBy = User });
        order.PaymentStatus = ComputePaymentStatus(order.Amount, order.Amount - order.RemainingAmount);
        await _db.SaveChangesAsync(ct);

        var pmName = await PmNameAsync(dto.PaymentMethodId, ct);
        var nm = order.CustomerId.HasValue ? null : (order.SenderName ?? order.RecipientName);
        // cari ise cari alacak kaydı da düş
        if (order.CustomerId.HasValue)
            await PostLedgerAsync(order.CustomerId.Value, "PAYMENT", 0m, dto.Amount, "ORDER_PAYMENT", order.Id, order.Code, $"Sipariş {order.Code} tahsilat", ct);
        PostCash("COLLECTION", "IN", dto.Amount, order.Id, order.CustomerId, pmName, $"Sipariş {order.Code} tahsilat{(string.IsNullOrWhiteSpace(nm) ? "" : $" · {nm}")}");
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task RefundAsync(string orderCode, OrderRefundInputDto dto, CancellationToken ct = default)
    {
        if (dto.Amount <= 0) throw new AppException("Geçerli bir tutar girin.");
        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        // Çift iadeyi önle: bu sipariş için iade edilebilir tutar = ödenen toplam. Aşılırsa engelle.
        var paidTotal = await _db.OrderPayments.Where(p => p.OrderId == order.Id).SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
        var refundedTotal = await _db.Refunds.Where(r => r.OrderId == order.Id && r.Status != "CANCELLED").SumAsync(r => (decimal?)r.RefundedAmount, ct) ?? 0m;
        if (refundedTotal + dto.Amount > paidTotal + 0.001m)
            throw new AppException($"Bu sipariş için iade edilebilir tutar aşıldı (ödenen {paidTotal:0.##} ₺, iade edilen {refundedTotal:0.##} ₺).");

        var pmName = await PmNameAsync(dto.PaymentMethodId, ct);
        var nm = order.CustomerId.HasValue
            ? await _db.Customers.Where(c => c.Id == order.CustomerId.Value).Select(c => c.Name).FirstOrDefaultAsync(ct)
            : (order.SenderName ?? order.RecipientName);

        // İade kaydı: bu siparişin AÇIK (bekleyen) iadesi varsa onu kapat — çift kayıt/bekleyen kalmasın.
        // Yoksa tamamlanmış yeni bir kayıt oluştur (izlenebilirlik).
        var openRefund = await _db.Refunds
            .Where(x => x.OrderId == order.Id && (x.Status == "PENDING" || x.Status == "PARTIAL"))
            .OrderBy(x => x.CreatedAt).ThenBy(x => x.Id)
            .FirstOrDefaultAsync(ct);
        if (openRefund is not null)
        {
            openRefund.RefundedAmount = Math.Min(openRefund.Amount, openRefund.RefundedAmount + dto.Amount);
            openRefund.Status = openRefund.RefundedAmount >= openRefund.Amount - 0.001m ? "DONE" : "PARTIAL";
            if (openRefund.Status == "DONE") openRefund.CompletedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.Note)) openRefund.Note = dto.Note;
        }
        else
        {
            _db.Refunds.Add(new Refund
            {
                OrderId = order.Id, OrderCode = order.Code, CustomerId = order.CustomerId,
                CustomerName = order.CustomerId.HasValue ? nm : null,
                RecipientName = order.CustomerId.HasValue ? null : (order.SenderName ?? order.RecipientName),
                RecipientPhone = order.CustomerId.HasValue ? null : (order.SenderPhone ?? order.RecipientPhone),
                Amount = dto.Amount, RefundedAmount = dto.Amount, Status = "DONE", Reason = dto.Note,
                CreatedAt = DateTime.UtcNow, CreatedBy = User, CompletedAt = DateTime.UtcNow
            });
        }
        // cari ise alacağı kapat (borç kaydı)
        if (order.CustomerId.HasValue)
            await PostLedgerAsync(order.CustomerId.Value, "REFUND", dto.Amount, 0m, "REFUND", order.Id, order.Code, $"Sipariş {order.Code} iade", ct);
        PostCash("REFUND", "OUT", dto.Amount, order.Id, order.CustomerId, pmName, $"Sipariş {order.Code} iade{(string.IsNullOrWhiteSpace(nm) ? "" : $" · {nm}")}");
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }

    public async Task UpdateByCodeAsync(string orderCode, OrderUpdateDto dto, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var order = await _db.Orders.Include(o => o.Payments).Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        var oldAmount = order.Amount;
        var oldCustomerId = order.CustomerId;
        order.Status = dto.OrderStatus ?? order.Status;
        order.SenderName = dto.SenderName ?? dto.OrderSender ?? order.SenderName;
        order.SenderPhone = dto.SenderPhone ?? order.SenderPhone;
        order.SenderEmail = dto.SenderEmail ?? order.SenderEmail;
        order.RecipientName = dto.RecipientName ?? dto.OrderTo ?? order.RecipientName;
        order.RecipientPhone = dto.RecipientPhone ?? order.RecipientPhone;
        order.RecipientEmail = dto.RecipientEmail ?? order.RecipientEmail;
        // Yapısal adres alanları: gönderildiyse güncelle ve tam adresi yeniden hesapla
        if (AddressFormatter.HasStructured(dto.RecipientAddressLine, dto.RecipientDistrict, dto.RecipientCity))
        {
            order.RecipientCity = dto.RecipientCity ?? order.RecipientCity;
            order.RecipientDistrict = dto.RecipientDistrict ?? order.RecipientDistrict;
            order.RecipientAddressLine = dto.RecipientAddressLine ?? order.RecipientAddressLine;
            order.RecipientAddress = AddressFormatter.FormatFull(order.RecipientAddressLine, order.RecipientDistrict, order.RecipientCity);
        }
        else if (dto.RecipientAddress != null)
        {
            order.RecipientAddress = dto.RecipientAddress;  // legacy serbest giriş
        }
        order.DeliveryDate = dto.OrderDeliveryDate ?? order.DeliveryDate;
        order.ProductType = dto.OrderProductType ?? order.ProductType;
        order.CustomerId = dto.CustomerId ?? order.CustomerId;
        order.Source = dto.Source ?? order.Source;
        order.DeliveryTimeRange = dto.DeliveryTimeRange ?? order.DeliveryTimeRange;
        order.DeliveryNote = dto.DeliveryNote ?? order.DeliveryNote;
        order.AssignedCourierId = dto.AssignedCourierId;   // null => atamayı kaldır
        if (dto.DiscountTotal.HasValue) order.DiscountTotal = dto.DiscountTotal.Value;
        if (dto.DeliveryFee.HasValue) order.DeliveryFee = dto.DeliveryFee.Value;
        if (dto.ExtraFee.HasValue) order.ExtraFee = dto.ExtraFee.Value;
        order.ExtraNote = dto.ExtraNote ?? order.ExtraNote;
        order.CardNote = dto.CardNote ?? order.CardNote;
        order.CustomerNote = dto.CustomerNote ?? order.CustomerNote;
        if (dto.IsNotified.HasValue) order.IsNotified = dto.IsNotified.Value;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = User;
        order.UpdatedByUserId = _current.UserId;

        // Kalemleri değiştir (stok farkı yönetilir): eski kalemlerin stoğunu iade et, yenileri düş
        if (dto.ReplaceItems == true && dto.Items is not null)
        {
            var trackedProdIds = order.Items.Where(i => i.IsStockTracked && i.ProductId.HasValue).Select(i => i.ProductId!.Value)
                .Concat(dto.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value)).Distinct().ToList();
            var prods = await _db.Products.Where(p => trackedProdIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);

            foreach (var old in order.Items)
                if (old.IsStockTracked && old.ProductId.HasValue && prods.TryGetValue(old.ProductId.Value, out var op))
                    await ApplyStockDeltaAsync(op, old.Quantity, order.Code, "ORDER_RETURN", ct);

            _db.OrderItems.RemoveRange(order.Items);
            order.Items.Clear();

            decimal sub = 0m;
            foreach (var it in dto.Items)
            {
                var lineTotal = Math.Max(0m, it.Quantity * it.UnitPrice - it.Discount);
                sub += lineTotal;
                var tracked = it.ProductId.HasValue && prods.TryGetValue(it.ProductId.Value, out var pr) && pr.TrackStock;
                order.Items.Add(new OrderItem
                {
                    ProductId = it.ProductId, ProductName = it.ProductName, Quantity = it.Quantity,
                    UnitPrice = it.UnitPrice, Discount = it.Discount, TotalPrice = lineTotal, IsStockTracked = tracked
                });
                if (tracked) await ApplyStockDeltaAsync(prods[it.ProductId!.Value], -it.Quantity, order.Code, "ORDER_OUT", ct);
            }
            order.SubTotal = sub;
        }
        else if (dto.OrderAmount.HasValue && (order.Items.Count == 0))
        {
            order.SubTotal = dto.OrderAmount.Value;
        }

        order.Amount = Math.Max(0m, order.SubTotal - order.DiscountTotal + order.DeliveryFee + order.ExtraFee);

        if (dto.ReplacePayments == true)
        {
            _db.OrderPayments.RemoveRange(order.Payments);
            order.Payments.Clear();
        }

        if (dto.Payments is { Count: > 0 })
        {
            var validPm = await ValidPaymentMethodIdsAsync(ct);
            foreach (var p in dto.Payments)
                order.Payments.Add(new OrderPayment
                {
                    Amount = p.PaymentAmount,
                    PaymentMethodId = NormalizePm(p.PaymentMethodId, validPm),
                    PaidAt = p.PaymentDate ?? DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = User
                });
        }

        // Kalan tutar = toplam - ödenen
        var paid = order.Payments.Sum(p => p.Amount);
        order.RemainingAmount = Math.Max(0m, order.Amount - paid);
        order.PaymentStatus = dto.PaymentStatus ?? ComputePaymentStatus(order.Amount, paid);

        await _db.SaveChangesAsync(ct);

        // Cari: aynı müşteride tutar değiştiyse farkı yansıt
        if (order.CustomerId.HasValue && order.CustomerId == oldCustomerId)
        {
            var diff = order.Amount - oldAmount;
            if (diff > 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_ADJUST", diff, 0m, "ORDER_ADJUST", order.Id, order.Code, "Sipariş tutarı arttı", ct);
            else if (diff < 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_ADJUST", 0m, -diff, "ORDER_ADJUST", order.Id, order.Code, "Sipariş tutarı azaldı", ct);
        }

        await tx.CommitAsync(ct);

        await _audit.LogAsync("UPDATE", "Orders", "Order", order.Id.ToString(),
            $"Sipariş güncellendi: {order.Code}", ct: ct);
    }

    public async Task DeleteByCodeAsync(string orderCode, OrderDeleteDto dto, CancellationToken ct = default)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        // Stok takipli kalemlerin stoğunu iade et
        await ReturnOrDeductItemStockAsync(order, returnStock: true, ct);

        order.IsDeleted = true;
        order.Status = "Silindi";
        order.DeletedAt = DateTime.UtcNow;
        order.DeletedByUserId = _current.UserId;
        order.DeletedByUserName = User;
        order.DeleteReason = dto.Reason;
        await _db.SaveChangesAsync(ct);

        // Cari: silinen siparişin BORÇ yükümlülüğünü tümüyle geri al.
        // Hedef bakiye katkısı = -(ödenen tutar): yani ödenen tutar müşteri ALACAĞI (iade) olarak kalır,
        // ödenmemiş (kalan) borç tamamen silinir. Ödeme yoksa katkı 0 olur (borç da, alacak da kalmaz).
        {
            var paidDel = Math.Max(0m, order.Amount - order.RemainingAmount);
            var hasRefundDel = await _db.Refunds.AnyAsync(r => r.OrderId == order.Id && r.Status != "CANCELLED", ct);
            var rpmId = dto.RefundPaymentMethodId ?? 0;
            var rpmName = rpmId > 0 ? await _db.PaymentMethods.Where(p => p.Id == rpmId).Select(p => p.Name).FirstOrDefaultAsync(ct) : null;

            if (order.CustomerId.HasValue)
            {
                var oid = order.Id; var ocode = order.Code;
                var alreadyCancelled = await _db.CustomerLedger.AnyAsync(l => l.OrderId == oid && l.ReferenceType == "ORDER_CANCEL", ct);
                if (!alreadyCancelled)
                {
                    var deb = await _db.CustomerLedger.Where(l => l.OrderId == oid || l.OrderCode == ocode).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
                    var cre = await _db.CustomerLedger.Where(l => l.OrderId == oid || l.OrderCode == ocode).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
                    var adjust = (-paidDel) - (deb - cre);
                    if (adjust > 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_CANCEL", adjust, 0m, "ORDER_CANCEL", order.Id, order.Code, $"Sipariş silindi: {dto.Reason}", ct);
                    else if (adjust < 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_CANCEL", 0m, -adjust, "ORDER_CANCEL", order.Id, order.Code, $"Sipariş silindi: {dto.Reason}", ct);
                }

                if (paidDel > 0 && !hasRefundDel)
                {
                    var custName = await _db.Customers.Where(c => c.Id == order.CustomerId.Value).Select(c => c.Name).FirstOrDefaultAsync(ct);
                    _db.Refunds.Add(new Refund
                    {
                        OrderId = order.Id, OrderCode = order.Code, CustomerId = order.CustomerId, CustomerName = custName,
                        Amount = paidDel, RefundedAmount = dto.FeeRefunded ? paidDel : 0m,
                        Status = dto.FeeRefunded ? "DONE" : "PENDING", Reason = dto.Reason,
                        PlannedDate = dto.FeeRefunded ? null : dto.RefundPlannedDate,
                        CreatedAt = DateTime.UtcNow, CreatedBy = User, CompletedAt = dto.FeeRefunded ? DateTime.UtcNow : null
                    });
                    await _db.SaveChangesAsync(ct);
                    if (dto.FeeRefunded)
                    {
                        await PostLedgerAsync(order.CustomerId.Value, "REFUND", paidDel, 0m, "REFUND", order.Id, order.Code, $"Sipariş {order.Code} iade", ct);
                        PostCash("REFUND", "OUT", paidDel, order.Id, order.CustomerId, rpmName, $"Sipariş {order.Code} iade");
                        await _db.SaveChangesAsync(ct);
                    }
                }
            }
            else if (paidDel > 0 && !hasRefundDel)
            {
                // Cari-olmayan: ödenen tutar için iade kaydı (alıcı/telefon ile izlenir)
                _db.Refunds.Add(new Refund
                {
                    OrderId = order.Id, OrderCode = order.Code, CustomerId = null,
                    RecipientName = order.SenderName ?? order.RecipientName,
                    RecipientPhone = order.SenderPhone ?? order.RecipientPhone,
                    Amount = paidDel, RefundedAmount = dto.FeeRefunded ? paidDel : 0m,
                    Status = dto.FeeRefunded ? "DONE" : "PENDING", Reason = dto.Reason,
                    PlannedDate = dto.FeeRefunded ? null : dto.RefundPlannedDate,
                    CreatedAt = DateTime.UtcNow, CreatedBy = User, CompletedAt = dto.FeeRefunded ? DateTime.UtcNow : null
                });
                await _db.SaveChangesAsync(ct);
                if (dto.FeeRefunded)
                {
                    var nm = order.SenderName ?? order.RecipientName;
                    PostCash("REFUND", "OUT", paidDel, order.Id, null, rpmName, $"Sipariş {order.Code} iade{(string.IsNullOrWhiteSpace(nm) ? "" : $" · {nm}")}");
                    await _db.SaveChangesAsync(ct);
                }
            }
        }

        await _audit.LogAsync("DELETE", "Orders", "Order", order.Id.ToString(),
            $"Sipariş silindi: {order.Code}. Sebep: {dto.Reason}", ct: ct);
    }

    public async Task RestoreByCodeAsync(string orderCode, CancellationToken ct = default)
    {
        var order = await _db.Orders.IgnoreQueryFilters().Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Code == orderCode && o.IsDeleted, ct)
            ?? throw new NotFoundException("deleted order not found");

        // Geri yüklemede stok tekrar düşülür
        await ReturnOrDeductItemStockAsync(order, returnStock: false, ct);

        order.IsDeleted = false;
        order.Status = "Yeni";
        order.DeletedAt = null;
        order.DeletedByUserId = null;
        order.DeletedByUserName = null;
        order.DeleteReason = null;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = User;
        await _db.SaveChangesAsync(ct);

        // Cari: silmede yapılan iptal (ORDER_CANCEL) hareketini geri al → siparişin yükümlülüğü yeniden uygulanır
        if (order.CustomerId.HasValue)
        {
            var cdeb = await _db.CustomerLedger.Where(l => l.OrderId == order.Id && l.ReferenceType == "ORDER_CANCEL").SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
            var ccre = await _db.CustomerLedger.Where(l => l.OrderId == order.Id && l.ReferenceType == "ORDER_CANCEL").SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
            if (ccre > cdeb) await PostLedgerAsync(order.CustomerId.Value, "ORDER_RESTORE", ccre - cdeb, 0m, "ORDER_RESTORE", order.Id, order.Code, "Sipariş geri yüklendi", ct);
            else if (cdeb > ccre) await PostLedgerAsync(order.CustomerId.Value, "ORDER_RESTORE", 0m, cdeb - ccre, "ORDER_RESTORE", order.Id, order.Code, "Sipariş geri yüklendi", ct);
        }

        // Bekleyen iadeleri iptal et
        var pendingRefunds = await _db.Refunds.Where(r => r.OrderId == order.Id && (r.Status == "PENDING" || r.Status == "PARTIAL")).ToListAsync(ct);
        foreach (var rf in pendingRefunds) { rf.Status = "CANCELLED"; rf.Note = (string.IsNullOrEmpty(rf.Note) ? "" : rf.Note + " · ") + "Sipariş geri yüklendi"; }
        if (pendingRefunds.Count > 0) await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("RESTORE", "Orders", "Order", order.Id.ToString(),
            $"Sipariş geri yüklendi: {order.Code}", ct: ct);
    }

    public async Task<IReadOnlyList<DeletedOrderItemDto>> ListDeletedAsync(CancellationToken ct = default) =>
        await _db.Orders.IgnoreQueryFilters().AsNoTracking()
            .Where(o => o.IsDeleted)
            .OrderByDescending(o => o.DeletedAt)
            .Select(o => new DeletedOrderItemDto
            {
                OrderPkId = o.Id,
                OrderCode = o.Code,
                RecipientName = o.RecipientName,
                SenderName = o.SenderName,
                OrderAmount = o.Amount,
                PaymentStatus = o.PaymentStatus,
                DeletedAt = o.DeletedAt,
                DeletedByUserName = o.DeletedByUserName,
                DeleteReason = o.DeleteReason
            })
            .ToListAsync(ct);

    public async Task AssignCourierByCodeAsync(string orderCode, AssignCourierDto dto, CancellationToken ct = default)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        var prevCourier = order.AssignedCourierId;
        order.AssignedCourierId = dto.CourierUserId;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = User;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("ASSIGN_COURIER", "Orders", "Order", order.Id.ToString(),
            $"Kurye atandı: {order.Code} -> kullanıcı {dto.CourierUserId}", ct: ct);

        // Yeni atanan kuryeye anlık bildirim (atama değiştiyse)
        if (dto.CourierUserId.HasValue && dto.CourierUserId != prevCourier)
            await NotifyCourierAsync(dto.CourierUserId.Value, order.Code, order.RecipientName, ct);
    }

    public async Task ChangeStatusByCodeAsync(string orderCode, ChangeStatusDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Status)) throw new AppException("Durum gerekli.");

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Code == orderCode, ct)
            ?? throw new NotFoundException("order not found");

        // Kurye yalnız kendi siparişinin durumunu değiştirebilir
        if (!_current.HasPermission(Permissions.OrdersViewAll) && _current.HasPermission(Permissions.OrdersViewOwn)
            && order.AssignedCourierId != _current.UserId)
            throw new ForbiddenException("Bu sipariş size atanmamış.");

        var old = order.Status;
        order.Status = dto.Status;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = User;
        order.StatusHistory.Add(new OrderStatusHistory
        {
            Status = dto.Status,
            ChangedByUserId = _current.UserId,
            ChangedByUserName = User,
            ChangedAt = DateTime.UtcNow,
            Note = dto.Note
        });
        await _db.SaveChangesAsync(ct);

        // İptal'e geçilince: cari borcu geri al + ödenen tutar için bekleyen iade oluştur (cari ya da cari-olmayan)
        if (dto.Status == "İptal Edildi" && old != "İptal Edildi")
            await ApplyCancellationAsync(order, dto.Note ?? "Sipariş iptal edildi", ct);

        await _audit.LogAsync("CHANGE_STATUS", "Orders", "Order", order.Id.ToString(),
            $"Durum: {old} -> {dto.Status}", ct: ct);

        // Durum gerçekten değiştiyse e-posta tetikle (commit sonrası, hata yutulur)
        if (old != dto.Status)
        {
            try { await _email.EnqueueForOrderStatusAsync(order.Id, ct); }
            catch { /* e-posta tetikleme hatası sipariş akışını bozmamalı (dispatcher loglar) */ }
        }
    }

    /// <summary>Sipariş iptal/silme finansalları: cari borcu geri al, ödenen tutar için bekleyen iade oluştur (idempotent).</summary>
    private async Task ApplyCancellationAsync(Order order, string reason, CancellationToken ct)
    {
        var paid = Math.Max(0m, order.Amount - order.RemainingAmount);

        if (order.CustomerId.HasValue)
        {
            var alreadyCancelled = await _db.CustomerLedger.AnyAsync(l => l.OrderId == order.Id && l.ReferenceType == "ORDER_CANCEL", ct);
            if (!alreadyCancelled)
            {
                var oid = order.Id; var ocode = order.Code;
                var deb = await _db.CustomerLedger.Where(l => l.OrderId == oid || l.OrderCode == ocode).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
                var cre = await _db.CustomerLedger.Where(l => l.OrderId == oid || l.OrderCode == ocode).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
                var adjust = (-paid) - (deb - cre);
                if (adjust > 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_CANCEL", adjust, 0m, "ORDER_CANCEL", order.Id, order.Code, $"Sipariş iptal: {reason}", ct);
                else if (adjust < 0) await PostLedgerAsync(order.CustomerId.Value, "ORDER_CANCEL", 0m, -adjust, "ORDER_CANCEL", order.Id, order.Code, $"Sipariş iptal: {reason}", ct);
            }
        }

        if (paid > 0)
        {
            var hasRefund = await _db.Refunds.AnyAsync(r => r.OrderId == order.Id && r.Status != "CANCELLED", ct);
            if (!hasRefund)
            {
                var custName = order.CustomerId.HasValue
                    ? await _db.Customers.Where(c => c.Id == order.CustomerId.Value).Select(c => c.Name).FirstOrDefaultAsync(ct)
                    : null;
                _db.Refunds.Add(new Refund
                {
                    OrderId = order.Id,
                    OrderCode = order.Code,
                    CustomerId = order.CustomerId,
                    CustomerName = custName,
                    RecipientName = order.CustomerId.HasValue ? null : (order.SenderName ?? order.RecipientName),
                    RecipientPhone = order.CustomerId.HasValue ? null : (order.SenderPhone ?? order.RecipientPhone),
                    Amount = paid,
                    RefundedAmount = 0m,
                    Status = "PENDING",
                    Reason = reason,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = User
                });
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    private async Task<HashSet<int>> ValidPaymentMethodIdsAsync(CancellationToken ct) =>
        (await _db.PaymentMethods.Select(p => p.Id).ToListAsync(ct)).ToHashSet();

    private static int? NormalizePm(int? id, HashSet<int> valid) =>
        id.HasValue && id.Value > 0 && valid.Contains(id.Value) ? id : null;

    private async Task<string> GenerateCodeAsync(CancellationToken ct)
    {
        var seq = await _db.OrderCodeSequences.OrderBy(s => s.Id).FirstOrDefaultAsync(ct);
        if (seq is null)
        {
            seq = new OrderCodeSequence { Prefix = "SIP", NextNumber = 1 };
            _db.OrderCodeSequences.Add(seq);
            await _db.SaveChangesAsync(ct);
        }

        var number = seq.NextNumber;
        seq.NextNumber++;
        await _db.SaveChangesAsync(ct);

        return $"{seq.Prefix}{DateTime.UtcNow:yyyyMMdd}{number:D5}";
    }

    private static (DateTime start, DateTime endExclusive) ParseDateRange(string? startStr, string? endStr)
    {
        if (string.IsNullOrWhiteSpace(startStr) || string.IsNullOrWhiteSpace(endStr))
            throw new AppException("StartDate and EndDate are required (yyyy-MM-dd).");

        if (!DateTime.TryParseExact(startStr, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var start))
            throw new AppException("Invalid StartDate format. Use yyyy-MM-dd.");

        if (!DateTime.TryParseExact(endStr, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var end))
            throw new AppException("Invalid EndDate format. Use yyyy-MM-dd.");

        return (start.Date, end.Date.AddDays(1));
    }
}
