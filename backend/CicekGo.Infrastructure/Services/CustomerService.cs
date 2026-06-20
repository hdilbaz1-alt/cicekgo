using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;

    public CustomerService(TenantDbContext db, ICurrentUser current)
    {
        _db = db;
        _current = current;
    }

    private string? User => _current.Username;

    public async Task<int> CreateAsync(CustomerAddDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.CustomerName))
            throw new AppException("CustomerName is required.");

        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var customer = new Customer
        {
            Name = dto.CustomerName.Trim(),
            CardName = dto.CardName,
            CustomerGroup = dto.CustomerGroup,
            Phone = dto.Phone,
            SecondaryPhone = dto.SecondaryPhone,
            Email = dto.Email,
            Address = dto.Address,
            City = dto.City,
            District = dto.District,
            CustomerType = dto.CustomerType,
            Tag = dto.Tag,
            OpeningBalance = dto.OpeningBalance ?? 0m,
            CreditLimit = dto.CreditLimit,
            ExtraNote = dto.ExtraNote,
            IsActive = dto.IsActive ?? true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User
        };

        if (dto.Billing is not null)
            customer.Billing = MapBilling(new CustomerBilling { CreatedAt = DateTime.UtcNow, CreatedBy = User }, dto.Billing);

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync(ct);

        await SyncGroupsAsync(customer.Id, dto.GroupIds, ct);

        await tx.CommitAsync(ct);
        return customer.Id;
    }

    public async Task UpdateAsync(CustomerUpdateDto dto, CancellationToken ct = default)
    {
        await using var tx = await _db.Database.BeginTransactionAsync(ct);

        var customer = await _db.Customers.Include(c => c.Billing)
            .FirstOrDefaultAsync(c => c.Id == dto.Id, ct)
            ?? throw new NotFoundException("customer not found");

        customer.Name = dto.CustomerName ?? customer.Name;
        customer.CardName = dto.CardName ?? customer.CardName;
        customer.CustomerGroup = dto.CustomerGroup ?? customer.CustomerGroup;
        customer.Phone = dto.Phone ?? customer.Phone;
        customer.SecondaryPhone = dto.SecondaryPhone ?? customer.SecondaryPhone;
        customer.Email = dto.Email ?? customer.Email;
        customer.Address = dto.Address ?? customer.Address;
        customer.City = dto.City ?? customer.City;
        customer.District = dto.District ?? customer.District;
        customer.CustomerType = dto.CustomerType ?? customer.CustomerType;
        customer.Tag = dto.Tag ?? customer.Tag;
        if (dto.OpeningBalance.HasValue) customer.OpeningBalance = dto.OpeningBalance.Value;
        if (dto.CreditLimit.HasValue) customer.CreditLimit = dto.CreditLimit;
        customer.ExtraNote = dto.ExtraNote ?? customer.ExtraNote;
        if (dto.IsActive.HasValue) customer.IsActive = dto.IsActive.Value;
        customer.UpdatedAt = DateTime.UtcNow;
        customer.UpdatedBy = User;

        if (dto.Billing is not null)
        {
            if (customer.Billing is null)
            {
                customer.Billing = MapBilling(new CustomerBilling { CustomerId = customer.Id, CreatedAt = DateTime.UtcNow, CreatedBy = User }, dto.Billing);
                _db.CustomerBillings.Add(customer.Billing);
            }
            else
            {
                MapBilling(customer.Billing, dto.Billing);
                customer.Billing.UpdatedAt = DateTime.UtcNow;
                customer.Billing.UpdatedBy = User;
            }
        }

        await _db.SaveChangesAsync(ct);

        if (dto.GroupIds is not null)
        {
            var existing = _db.CustomerGroupMembers.Where(m => m.CustomerId == customer.Id);
            _db.CustomerGroupMembers.RemoveRange(existing);
            await _db.SaveChangesAsync(ct);
            await SyncGroupsAsync(customer.Id, dto.GroupIds, ct);
        }

        await tx.CommitAsync(ct);
    }

    public async Task DeleteAsync(int customerId, CancellationToken ct = default)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Id == customerId, ct)
            ?? throw new NotFoundException("customer not found");
        // Billing, group members ve ledger FK cascade ile silinir.
        _db.Customers.Remove(customer);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<CustomerDto?> GetByIdAsync(int customerId, CancellationToken ct = default) =>
        await _db.Customers.AsNoTracking()
            .Where(c => c.Id == customerId)
            .Select(c => new CustomerDto
            {
                CustomerId = c.Id,
                CustomerName = c.Name,
                CardName = c.CardName,
                CustomerGroup = c.CustomerGroup,
                Phone = c.Phone,
                SecondaryPhone = c.SecondaryPhone,
                Email = c.Email,
                Address = c.Address,
                City = c.City,
                District = c.District,
                CustomerType = c.CustomerType,
                Tag = c.Tag,
                OpeningBalance = c.OpeningBalance,
                CreditLimit = c.CreditLimit,
                ExtraNote = c.ExtraNote,
                IsActive = c.IsActive,
                CreatedDate = c.CreatedAt,
                CreatedUser = c.CreatedBy,
                UpdatedDate = c.UpdatedAt,
                UpdatedUser = c.UpdatedBy
            })
            .FirstOrDefaultAsync(ct);

    public async Task<PagedResult<CustomerListItemDto>> ListAsync(CustomerListRequestDto request, CancellationToken ct = default)
    {
        var page = request.Page < 1 ? 1 : request.Page;
        var pageSize = request.PageSize switch { < 1 => 50, > 500 => 500, _ => request.PageSize };
        var search = string.IsNullOrWhiteSpace(request.Search) ? null : request.Search.Trim();

        var query = _db.Customers.AsNoTracking().AsQueryable();
        if (search is not null)
        {
            var like = $"%{search}%";
            query = query.Where(c =>
                EF.Functions.ILike(c.Name, like) ||
                (c.CardName != null && EF.Functions.ILike(c.CardName, like)) ||
                (c.Email != null && EF.Functions.ILike(c.Email, like)) ||
                (c.Phone != null && EF.Functions.ILike(c.Phone, like)));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(c => c.Name).ThenBy(c => c.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(c => new CustomerListItemDto
            {
                CustomerId = c.Id,
                CustomerName = c.Name,
                CardName = c.CardName,
                CustomerGroup = c.CustomerGroup,
                Phone = c.Phone,
                SecondaryPhone = c.SecondaryPhone,
                Email = c.Email,
                Address = c.Address,
                City = c.City,
                District = c.District,
                CustomerType = c.CustomerType,
                Tag = c.Tag,
                OpeningBalance = c.OpeningBalance,
                CreditLimit = c.CreditLimit,
                ExtraNote = c.ExtraNote,
                IsActive = c.IsActive,
                CreatedDate = c.CreatedAt,
                CreatedUser = c.CreatedBy,
                UpdatedDate = c.UpdatedAt,
                UpdatedUser = c.UpdatedBy,
                BillingId = c.Billing != null ? c.Billing.Id : (int?)null,
                TaxNumber = c.Billing != null ? c.Billing.TaxNumber : null,
                TaxOffice = c.Billing != null ? c.Billing.TaxOffice : null,
                SendMethod = c.Billing != null ? c.Billing.SendMethod : null,
                FirstName = c.Billing != null ? c.Billing.FirstName : null,
                LastName = c.Billing != null ? c.Billing.LastName : null,
                Title = c.Billing != null ? c.Billing.Title : null,
                Country = c.Billing != null ? c.Billing.Country : null,
                BillingCity = c.Billing != null ? c.Billing.City : null,
                BillingDistrict = c.Billing != null ? c.Billing.District : null,
                BillingAddress = c.Billing != null ? c.Billing.Address : null,
                BillingPhone = c.Billing != null ? c.Billing.Phone : null,
                BillingEmail = c.Billing != null ? c.Billing.Email : null,
                Website = c.Billing != null ? c.Billing.Website : null
            })
            .ToListAsync(ct);

        return new PagedResult<CustomerListItemDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        };
    }

    private async Task SyncGroupsAsync(int customerId, List<int>? groupIds, CancellationToken ct)
    {
        if (groupIds is null || groupIds.Count == 0) return;

        var ids = groupIds.Where(g => g > 0).Distinct().ToArray();
        if (ids.Length == 0) return;

        var validGroupIds = await _db.CustomerGroups
            .Where(g => ids.Contains(g.Id))
            .Select(g => g.Id)
            .ToListAsync(ct);

        foreach (var gid in validGroupIds)
            _db.CustomerGroupMembers.Add(new CustomerGroupMember { GroupId = gid, CustomerId = customerId });

        await _db.SaveChangesAsync(ct);
    }

    private static CustomerBilling MapBilling(CustomerBilling target, CustomerBillingDto dto)
    {
        target.TaxNumber = dto.TaxNumber ?? target.TaxNumber;
        target.TaxOffice = dto.TaxOffice ?? target.TaxOffice;
        target.SendMethod = dto.SendMethod ?? target.SendMethod;
        target.FirstName = dto.FirstName ?? target.FirstName;
        target.LastName = dto.LastName ?? target.LastName;
        target.Title = dto.Title ?? target.Title;
        target.Country = dto.Country ?? target.Country;
        target.City = dto.City ?? target.City;
        target.District = dto.District ?? target.District;
        target.Address = dto.Address ?? target.Address;
        target.Phone = dto.Phone ?? target.Phone;
        target.Email = dto.Email ?? target.Email;
        target.Website = dto.Website ?? target.Website;
        return target;
    }
}
