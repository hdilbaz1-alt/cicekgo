using CicekGo.Application.Common;
using CicekGo.Application.Email;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly TenantDbContext _db;
    public EmailTemplateService(TenantDbContext db) => _db = db;

    private static EmailTemplateDto Map(EmailTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, Subject = t.Subject, DesignJson = t.DesignJson,
        HtmlBody = t.HtmlBody, IsActive = t.IsActive, CreatedAtUtc = t.CreatedAtUtc,
    };

    public async Task<IReadOnlyList<EmailTemplateDto>> ListAsync(CancellationToken ct = default) =>
        await _db.EmailTemplates.AsNoTracking().OrderBy(t => t.Name).Select(t => Map(t)).ToListAsync(ct);

    public async Task<EmailTemplateDto> CreateAsync(UpsertEmailTemplateDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Şablon adı gerekli.");
        if (string.IsNullOrWhiteSpace(dto.Subject)) throw new AppException("Konu gerekli.");
        var t = new EmailTemplate
        {
            Name = dto.Name.Trim(), Subject = dto.Subject.Trim(), DesignJson = dto.DesignJson,
            HtmlBody = dto.HtmlBody ?? "", IsActive = dto.IsActive, CreatedAtUtc = DateTime.UtcNow,
        };
        _db.EmailTemplates.Add(t);
        await _db.SaveChangesAsync(ct);
        return Map(t);
    }

    public async Task<EmailTemplateDto> UpdateAsync(int id, UpsertEmailTemplateDto dto, CancellationToken ct = default)
    {
        var t = await _db.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Şablon bulunamadı.");
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Şablon adı gerekli.");
        t.Name = dto.Name.Trim(); t.Subject = dto.Subject.Trim(); t.DesignJson = dto.DesignJson;
        t.HtmlBody = dto.HtmlBody ?? ""; t.IsActive = dto.IsActive; t.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Map(t);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var inUse = await _db.OrderStatusEmailTriggers.AnyAsync(x => x.TemplateId == id, ct);
        if (inUse) throw new AppException("Bu şablon bir durum eşleştirmesinde kullanılıyor; önce eşleştirmeyi kaldırın.");
        var t = await _db.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Şablon bulunamadı.");
        _db.EmailTemplates.Remove(t);
        await _db.SaveChangesAsync(ct);
    }

    public Task<PreviewResultDto> PreviewAsync(PreviewRequestDto dto, CancellationToken ct = default)
    {
        var model = EmailMergeModel.Sample();
        return Task.FromResult(new PreviewResultDto
        {
            Subject = EmailRenderer.Render(dto.Subject ?? "", model),
            Html = EmailRenderer.Render(dto.HtmlBody ?? "", model),
        });
    }

    public IReadOnlyList<MergeTagDto> MergeTags() => new List<MergeTagDto>
    {
        new() { Code = "order.code", Label = "Sipariş Kodu", Insert = "{{ order.code }}" },
        new() { Code = "order.status", Label = "Sipariş Durumu", Insert = "{{ order.status }}" },
        new() { Code = "order.total", Label = "Toplam Tutar", Insert = "{{ order.total }}" },
        new() { Code = "order.delivery_date", Label = "Teslimat Tarihi", Insert = "{{ order.delivery_date }}" },
        new() { Code = "order.note", Label = "Kart Notu", Insert = "{{ order.note }}" },
        new() { Code = "recipient.name", Label = "Alıcı Adı", Insert = "{{ recipient.name }}" },
        new() { Code = "recipient.phone", Label = "Alıcı Telefon", Insert = "{{ recipient.phone }}" },
        new() { Code = "sender.name", Label = "Gönderici Adı", Insert = "{{ sender.name }}" },
        new() { Code = "sender.phone", Label = "Gönderici Telefon", Insert = "{{ sender.phone }}" },
        new() { Code = "company.name", Label = "Firma Adı", Insert = "{{ company.name }}" },
        new() { Code = "order.items", Label = "Ürün Listesi (döngü)", Insert = "{{ for item in order.items }}\n  {{ item.name }} × {{ item.qty }} = {{ item.total }}\n{{ end }}" },
    };
}
