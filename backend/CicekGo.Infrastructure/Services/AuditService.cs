using CicekGo.Application.Audit;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly TenantDbContext _db;
    public AuditService(TenantDbContext db) => _db = db;

    public async Task<AuditListResult> ListAsync(AuditListRequest req, CancellationToken ct = default)
    {
        var (f, tt) = DateRange.Utc(req.StartDate, req.EndDate);
        var q = _db.AuditLogs.AsNoTracking().AsQueryable();
        if (f.HasValue) q = q.Where(a => a.CreatedAt >= f.Value);
        if (tt.HasValue) q = q.Where(a => a.CreatedAt < tt.Value);
        if (!string.IsNullOrWhiteSpace(req.ActionType)) q = q.Where(a => a.ActionType == req.ActionType);
        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var s = req.Search.Trim().ToLower();
            q = q.Where(a => (a.Description != null && a.Description.ToLower().Contains(s))
                || (a.UserFullName != null && a.UserFullName.ToLower().Contains(s))
                || (a.ModuleName != null && a.ModuleName.ToLower().Contains(s)));
        }

        var total = await q.CountAsync(ct);
        var page = req.Page < 1 ? 1 : req.Page;
        var size = req.PageSize is < 1 or > 200 ? 50 : req.PageSize;
        var items = await q.OrderByDescending(a => a.Id)
            .Skip((page - 1) * size).Take(size)
            .Select(a => new AuditLogDto
            {
                Id = a.Id, UserId = a.UserId, UserFullName = a.UserFullName, ActionType = a.ActionType,
                ModuleName = a.ModuleName, EntityType = a.EntityType, EntityId = a.EntityId,
                Description = a.Description, IpAddress = a.IpAddress, CreatedAt = a.CreatedAt
            }).ToListAsync(ct);

        return new AuditListResult { TotalCount = total, Page = page, PageSize = size, Items = items };
    }
}
