using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Finance;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;
    public ExpenseService(TenantDbContext db, ICurrentUser current) { _db = db; _current = current; }

    public async Task<IReadOnlyList<ExpenseDto>> GetAllAsync(DateTime? from, DateTime? to, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(from, to);
        var q = _db.Expenses.AsNoTracking().AsQueryable();
        if (f.HasValue) q = q.Where(e => e.TransactionDate >= f.Value);
        if (tt.HasValue) q = q.Where(e => e.TransactionDate < tt.Value);
        return await q.OrderByDescending(e => e.TransactionDate).ThenByDescending(e => e.Id)
            .Select(e => new ExpenseDto
            {
                Id = e.Id, Category = e.Category, Amount = e.Amount, PaymentMethod = e.PaymentMethod,
                Description = e.Description, TransactionDate = e.TransactionDate, CreatedByUserName = e.CreatedByUserName
            }).ToListAsync(ct);
    }

    public async Task<int> CreateAsync(ExpenseCreateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Category)) throw new AppException("Gider kategorisi gerekli.");
        if (dto.Amount <= 0) throw new AppException("Tutar 0'dan büyük olmalı.");
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var exp = new Expense
        {
            Category = dto.Category.Trim(), Amount = dto.Amount, PaymentMethod = dto.PaymentMethod,
            Description = dto.Description, TransactionDate = dto.TransactionDate ?? DateTime.UtcNow,
            CreatedByUserId = _current.UserId, CreatedByUserName = _current.Username, CreatedAt = DateTime.UtcNow
        };
        _db.Expenses.Add(exp);

        _db.CashMovements.Add(new CashMovement
        {
            MovementType = "EXPENSE", Direction = "OUT", Amount = dto.Amount, PaymentMethod = dto.PaymentMethod,
            Description = $"Gider: {dto.Category}", TransactionDate = exp.TransactionDate,
            CreatedByUserId = _current.UserId, CreatedByUserName = _current.Username, CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return exp.Id;
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.Expenses.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("gider bulunamadı");
        _db.Expenses.Remove(e);
        await _db.SaveChangesAsync(ct);
    }
}
