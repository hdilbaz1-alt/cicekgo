using CicekGo.Application.Common;
using CicekGo.Application.Customers;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class CustomerGroupService : ICustomerGroupService
{
    private readonly TenantDbContext _db;
    public CustomerGroupService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<CustomerGroupListItemDto>> GetGroupsAsync(CancellationToken ct = default) =>
        await _db.CustomerGroups.AsNoTracking()
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new CustomerGroupListItemDto
            {
                Id = g.Id,
                GroupName = g.Name,
                Description = g.Description,
                CreatedAt = g.CreatedAt
            })
            .ToListAsync(ct);

    public async Task<int> CreateGroupAsync(CustomerGroupAddDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.GroupName))
            throw new AppException("GroupName is required.");

        var g = new CustomerGroup { Name = dto.GroupName.Trim(), Description = dto.Description, CreatedAt = DateTime.UtcNow };
        _db.CustomerGroups.Add(g);
        await _db.SaveChangesAsync(ct);
        return g.Id;
    }

    public async Task DeleteGroupAsync(int id, CancellationToken ct = default)
    {
        var g = await _db.CustomerGroups.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("group not found");
        _db.CustomerGroups.Remove(g); // üyelikler cascade ile silinir
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddMemberAsync(CustomerGroupMemberAddDto dto, CancellationToken ct = default)
    {
        var groupExists = await _db.CustomerGroups.AnyAsync(g => g.Id == dto.GroupId, ct);
        if (!groupExists) throw new NotFoundException("group not found");

        var customerExists = await _db.Customers.AnyAsync(c => c.Id == dto.CustomerId, ct);
        if (!customerExists) throw new NotFoundException("customer not found");

        var already = await _db.CustomerGroupMembers
            .AnyAsync(m => m.GroupId == dto.GroupId && m.CustomerId == dto.CustomerId, ct);
        if (already) return;

        _db.CustomerGroupMembers.Add(new CustomerGroupMember { GroupId = dto.GroupId, CustomerId = dto.CustomerId });
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<CustomerGroupMemberListDto>> ListMembersAsync(
        string? search, int page, int pageSize, CancellationToken ct = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize switch { < 1 => 50, > 500 => 500, _ => pageSize };
        var s = string.IsNullOrWhiteSpace(search) ? null : search.Trim();

        var query =
            from m in _db.CustomerGroupMembers.AsNoTracking()
            join g in _db.CustomerGroups on m.GroupId equals g.Id
            join c in _db.Customers on m.CustomerId equals c.Id
            select new { m.Id, m.GroupId, g.Name, g.Description, m.CustomerId, CustomerName = c.Name };

        if (s is not null)
        {
            var like = $"%{s}%";
            query = query.Where(x => EF.Functions.ILike(x.CustomerName, like) || EF.Functions.ILike(x.Name, like));
        }

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderBy(x => x.Id)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new CustomerGroupMemberListDto
            {
                Id = x.Id,
                GroupId = x.GroupId,
                GroupName = x.Name,
                Description = x.Description,
                CustomerId = x.CustomerId,
                CustomerName = x.CustomerName
            })
            .ToListAsync(ct);

        return new PagedResult<CustomerGroupMemberListDto>
        {
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            Items = items
        };
    }
}
