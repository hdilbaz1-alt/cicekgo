using CicekGo.Application.Common;
using CicekGo.Application.Email;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class EmailTriggerService : IEmailTriggerService
{
    private readonly TenantDbContext _db;
    public EmailTriggerService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<EmailTriggerDto>> ListAsync(CancellationToken ct = default)
    {
        var statuses = await _db.OrderStatuses.AsNoTracking().Where(s => s.IsActive).OrderBy(s => s.SortOrder).ToListAsync(ct);
        var triggers = await _db.OrderStatusEmailTriggers.AsNoTracking().Include(t => t.Template).ToListAsync(ct);
        return statuses.Select(s =>
        {
            var t = triggers.FirstOrDefault(x => x.OrderStatusId == s.Id);
            return new EmailTriggerDto
            {
                OrderStatusId = s.Id, StatusName = s.Name, Color = s.Color,
                TriggerId = t?.Id, TemplateId = t?.TemplateId, TemplateName = t?.Template?.Name, IsActive = t?.IsActive ?? false,
            };
        }).ToList();
    }

    public async Task SetTemplateAsync(int orderStatusId, int? templateId, CancellationToken ct = default)
    {
        var trig = await _db.OrderStatusEmailTriggers.FirstOrDefaultAsync(x => x.OrderStatusId == orderStatusId, ct);
        if (templateId is null)
        {
            if (trig is not null) { _db.OrderStatusEmailTriggers.Remove(trig); await _db.SaveChangesAsync(ct); }
            return;
        }
        if (!await _db.EmailTemplates.AnyAsync(x => x.Id == templateId, ct)) throw new AppException("Şablon bulunamadı.");
        if (trig is null)
        {
            _db.OrderStatusEmailTriggers.Add(new OrderStatusEmailTrigger
            { OrderStatusId = orderStatusId, TemplateId = templateId.Value, IsActive = false, CreatedAtUtc = DateTime.UtcNow });
        }
        else { trig.TemplateId = templateId.Value; trig.UpdatedAtUtc = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
    }

    public async Task SetActiveAsync(int orderStatusId, bool isActive, CancellationToken ct = default)
    {
        var trig = await _db.OrderStatusEmailTriggers.FirstOrDefaultAsync(x => x.OrderStatusId == orderStatusId, ct)
            ?? throw new AppException("Önce bir şablon eşleştirin.");
        if (isActive)
        {
            var verified = await _db.EmailSettings.AnyAsync(x => x.IsVerified, ct);
            if (!verified) throw new ConflictException("SMTP ayarları doğrulanmadan eşleştirme aktif edilemez.");
        }
        trig.IsActive = isActive;
        trig.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
