using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

/// <summary>
/// Cari hesap. Konvansiyon: Debit = borç (sipariş), Credit = alacak (ödeme).
/// Bakiye (pozitif = müşteri bize borçlu) = SUM(Debit) - SUM(Credit).
/// </summary>
public class CustomerLedgerService : ICustomerLedgerService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;

    public CustomerLedgerService(TenantDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    private string? User => _current.Username;

    public async Task<IReadOnlyList<CustomerBalanceDto>> GetAllBalancesAsync(CancellationToken ct = default)
    {
        return await _db.Customers.AsNoTracking()
            .Where(c => c.IsActive)
            .Select(c => new CustomerBalanceDto
            {
                CustomerId = c.Id,
                CustomerName = c.Name,
                TotalDebit = c.LedgerEntries.Sum(l => (decimal?)l.Debit) ?? 0m,
                TotalCredit = c.LedgerEntries.Sum(l => (decimal?)l.Credit) ?? 0m,
                Balance = (c.LedgerEntries.Sum(l => (decimal?)l.Debit) ?? 0m) - (c.LedgerEntries.Sum(l => (decimal?)l.Credit) ?? 0m),
                LastTransactionDate = c.LedgerEntries.Max(l => (DateTime?)l.TransactionDate) ?? c.CreatedAt
            })
            .OrderByDescending(x => x.Balance)
            .ToListAsync(ct);
    }

    public async Task<PagedResult<CustomerLedgerDto>> GetLedgerAsync(CustomerLedgerListRequestDto request, CancellationToken ct = default)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch { < 1 => 50, > 500 => 500, _ => request.PageSize };

        var query = _db.CustomerLedger.AsNoTracking()
            .Where(l => l.CustomerId == request.CustomerId);

        if (request.StartDate.HasValue)
            query = query.Where(l => l.TransactionDate >= request.StartDate.Value.Date);
        if (request.EndDate.HasValue)
            query = query.Where(l => l.TransactionDate < request.EndDate.Value.Date.AddDays(1));
        if (!string.IsNullOrWhiteSpace(request.TransactionType))
            query = query.Where(l => l.TransactionType == request.TransactionType);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(l => l.TransactionDate).ThenByDescending(l => l.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(l => new CustomerLedgerDto
            {
                Id = l.Id,
                CustomerId = l.CustomerId,
                TransactionDate = l.TransactionDate,
                TransactionType = l.TransactionType,
                Description = l.Description,
                Debit = l.Debit,
                Credit = l.Credit,
                Balance = l.Balance,
                ReferenceId = l.ReferenceId,
                ReferenceType = l.ReferenceType,
                OrderCode = l.OrderCode,
                CustomerNote = l.CustomerNote,
                CreatedBy = l.CreatedBy,
                CreatedDate = l.CreatedAt
            })
            .ToListAsync(ct);

        return new PagedResult<CustomerLedgerDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        };
    }

    public async Task<int> AddPaymentAsync(CustomerPaymentDto dto, CancellationToken ct = default)
    {
        await EnsureCustomerAsync(dto.CustomerId, ct);

        var entry = await InsertEntryAsync(new CustomerLedgerEntry
        {
            CustomerId = dto.CustomerId,
            TransactionDate = dto.PaymentDate ?? DateTime.UtcNow,
            TransactionType = "PAYMENT",
            Description = dto.Description ?? "Ödeme",
            Debit = 0m,
            Credit = dto.Amount,
            ReferenceType = "PAYMENT"
        }, ct);

        AddCash("COLLECTION", dto.Amount, null, dto.CustomerId, dto.Description ?? "Tahsilat", await PmNameAsync(dto.PaymentMethodId, ct));
        await _db.SaveChangesAsync(ct);

        return entry.Id;
    }

    private async Task<string?> PmNameAsync(int? id, CancellationToken ct) =>
        id.HasValue && id.Value > 0 ? await _db.PaymentMethods.Where(p => p.Id == id.Value).Select(p => p.Name).FirstOrDefaultAsync(ct) : null;

    public async Task<int> AddCreditPayoutAsync(CustomerPayoutDto dto, CancellationToken ct = default)
    {
        await EnsureCustomerAsync(dto.CustomerId, ct);
        if (dto.Amount <= 0) throw new AppException("Geçerli bir tutar girin.");

        // Müşteriye para iadesi: cari borç kaydı (alacağı azaltır) + kasa çıkışı
        var entry = await InsertEntryAsync(new CustomerLedgerEntry
        {
            CustomerId = dto.CustomerId,
            TransactionDate = dto.PaymentDate ?? DateTime.UtcNow,
            TransactionType = "REFUND",
            Description = string.IsNullOrWhiteSpace(dto.Description) ? "Alacak ödemesi (iade)" : dto.Description!.Trim(),
            Debit = dto.Amount,
            Credit = 0m,
            ReferenceType = "CREDIT_PAYOUT"
        }, ct);

        AddCashOut("REFUND", dto.Amount, dto.CustomerId, string.IsNullOrWhiteSpace(dto.Description) ? "Müşteri alacak iadesi" : dto.Description!.Trim(), await PmNameAsync(dto.PaymentMethodId, ct));
        await _db.SaveChangesAsync(ct);
        return entry.Id;
    }

    private void AddCashOut(string type, decimal amount, int? customerId, string? desc, string? method = null)
    {
        if (amount <= 0) return;
        _db.CashMovements.Add(new Domain.Tenant.CashMovement
        {
            MovementType = type, Direction = "OUT", Amount = amount, CustomerId = customerId,
            PaymentMethod = method,
            Description = desc, TransactionDate = DateTime.UtcNow, CreatedByUserId = _current.UserId,
            CreatedByUserName = _current.Username, CreatedAt = DateTime.UtcNow
        });
    }

    private void AddCash(string type, decimal amount, int? orderId, int? customerId, string? desc, string? method = null)
    {
        if (amount <= 0) return;
        _db.CashMovements.Add(new Domain.Tenant.CashMovement
        {
            MovementType = type, Direction = "IN", Amount = amount, OrderId = orderId, CustomerId = customerId,
            PaymentMethod = method,
            Description = desc, TransactionDate = DateTime.UtcNow, CreatedByUserId = _current.UserId,
            CreatedByUserName = _current.Username, CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<int> AddOrderPaymentAsync(CustomerOrderPaymentDto dto, CancellationToken ct = default)
    {
        await EnsureCustomerAsync(dto.CustomerId, ct);

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Code == dto.OrderCode, ct)
            ?? throw new NotFoundException("order not found");

        var newRemaining = order.RemainingAmount - dto.Amount;
        if (newRemaining < 0)
            throw new AppException("Ödeme tutarı kalan tutardan fazla olamaz");

        order.RemainingAmount = newRemaining;
        order.UpdatedAt = DateTime.UtcNow;
        order.UpdatedBy = User;

        int? pmId = dto.PaymentMethodId;
        if (pmId.HasValue && (pmId.Value <= 0 || !await _db.PaymentMethods.AnyAsync(p => p.Id == pmId.Value, ct)))
            pmId = null;

        var payment = new OrderPayment
        {
            OrderId = order.Id,
            Amount = dto.Amount,
            PaymentMethodId = pmId,
            PaidAt = dto.PaymentDate ?? DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User
        };
        _db.OrderPayments.Add(payment);
        await _db.SaveChangesAsync(ct);

        // Açıklama her zaman "siparişe ödeme" olarak geçer; kullanıcı notu varsa eklenir.
        var baseDesc = $"Sipariş ödemesi - {dto.OrderCode}";
        var fullDesc = string.IsNullOrWhiteSpace(dto.Description) ? baseDesc : $"{baseDesc} · {dto.Description.Trim()}";

        var entry = await InsertEntryAsync(new CustomerLedgerEntry
        {
            CustomerId = dto.CustomerId,
            TransactionDate = dto.PaymentDate ?? DateTime.UtcNow,
            TransactionType = "PAYMENT",
            Description = fullDesc,
            Debit = 0m,
            Credit = dto.Amount,
            ReferenceId = payment.Id,
            ReferenceType = "ORDER_PAYMENT",
            OrderCode = dto.OrderCode
        }, ct);

        AddCash("COLLECTION", dto.Amount, order.Id, dto.CustomerId, fullDesc, await PmNameAsync(dto.PaymentMethodId, ct));
        await _db.SaveChangesAsync(ct);

        await tx.CommitAsync(ct);
        return entry.Id;
    }

    public async Task<int> AddEntryAsync(CustomerLedgerAddDto dto, CancellationToken ct = default)
    {
        await EnsureCustomerAsync(dto.CustomerId, ct);

        var entry = await InsertEntryAsync(new CustomerLedgerEntry
        {
            CustomerId = dto.CustomerId,
            TransactionDate = DateTime.UtcNow,
            TransactionType = string.IsNullOrWhiteSpace(dto.TransactionType) ? "ADJUSTMENT" : dto.TransactionType,
            Description = dto.Description,
            Debit = dto.Debit,
            Credit = dto.Credit,
            CustomerNote = dto.CustomerNote
        }, ct);

        return entry.Id;
    }

    private async Task<CustomerLedgerEntry> InsertEntryAsync(CustomerLedgerEntry entry, CancellationToken ct)
    {
        var current = await GetCurrentBalanceAsync(entry.CustomerId, ct);
        entry.Balance = current + entry.Debit - entry.Credit;
        entry.CreatedBy = User;
        entry.CreatedAt = DateTime.UtcNow;

        _db.CustomerLedger.Add(entry);
        await _db.SaveChangesAsync(ct);
        return entry;
    }

    private async Task<decimal> GetCurrentBalanceAsync(int customerId, CancellationToken ct)
    {
        var debit = await _db.CustomerLedger.Where(l => l.CustomerId == customerId).SumAsync(l => (decimal?)l.Debit, ct) ?? 0m;
        var credit = await _db.CustomerLedger.Where(l => l.CustomerId == customerId).SumAsync(l => (decimal?)l.Credit, ct) ?? 0m;
        return debit - credit;
    }

    private async Task EnsureCustomerAsync(int customerId, CancellationToken ct)
    {
        if (!await _db.Customers.AnyAsync(c => c.Id == customerId, ct))
            throw new NotFoundException("customer not found");
    }
}
