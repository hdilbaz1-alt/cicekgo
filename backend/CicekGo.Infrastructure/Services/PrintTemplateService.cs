using CicekGo.Application.Common;
using CicekGo.Application.Printing;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class PrintTemplateService : IPrintTemplateService
{
    private readonly TenantDbContext _db;
    public PrintTemplateService(TenantDbContext db) => _db = db;

    public async Task<IReadOnlyList<PrintTemplateDto>> ListAsync(CancellationToken ct = default)
        => await _db.PrintTemplates.AsNoTracking()
            .OrderByDescending(t => t.IsDefault).ThenBy(t => t.Name)
            .Select(t => Map(t)).ToListAsync(ct);

    public async Task<int> CreateAsync(PrintTemplateSaveDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) throw new AppException("Şablon adı gerekli.");
        var any = await _db.PrintTemplates.AnyAsync(ct);
        var e = new PrintTemplate();
        Apply(e, dto);
        if (!any) e.IsDefault = true;          // ilk şablon varsayılan
        if (dto.IsDefault) await ClearDefaultsAsync(ct);
        e.CreatedAt = DateTime.UtcNow;
        _db.PrintTemplates.Add(e);
        await _db.SaveChangesAsync(ct);
        return e.Id;
    }

    public async Task UpdateAsync(int id, PrintTemplateSaveDto dto, CancellationToken ct = default)
    {
        var e = await _db.PrintTemplates.FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new NotFoundException("şablon bulunamadı");
        var wasDefault = e.IsDefault;
        if (dto.IsDefault && !wasDefault) await ClearDefaultsAsync(ct);
        Apply(e, dto);
        if (wasDefault) e.IsDefault = true;    // varsayılanı düzenlerken varsayılan kalsın
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.PrintTemplates.FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new NotFoundException("şablon bulunamadı");
        _db.PrintTemplates.Remove(e);
        await _db.SaveChangesAsync(ct);
        if (e.IsDefault)
        {
            var next = await _db.PrintTemplates.FirstOrDefaultAsync(ct);
            if (next != null) { next.IsDefault = true; await _db.SaveChangesAsync(ct); }
        }
    }

    public async Task SetDefaultAsync(int id, CancellationToken ct = default)
    {
        var e = await _db.PrintTemplates.FirstOrDefaultAsync(t => t.Id == id, ct) ?? throw new NotFoundException("şablon bulunamadı");
        await ClearDefaultsAsync(ct);
        e.IsDefault = true;
        await _db.SaveChangesAsync(ct);
    }

    private async Task ClearDefaultsAsync(CancellationToken ct)
    {
        await _db.PrintTemplates.Where(t => t.IsDefault).ExecuteUpdateAsync(s => s.SetProperty(t => t.IsDefault, false), ct);
    }

    private static void Apply(PrintTemplate e, PrintTemplateSaveDto d)
    {
        e.Name = d.Name.Trim(); e.TemplateType = d.TemplateType; e.PaperType = d.PaperType; e.Rotation = d.Rotation;
        e.Theme = d.Theme; e.Style = d.Style; e.IsDefault = d.IsDefault;
        e.ShowOrderCode = d.ShowOrderCode; e.ShowCreatedDate = d.ShowCreatedDate; e.ShowPrice = d.ShowPrice;
        e.ShowPaymentStatus = d.ShowPaymentStatus; e.ShowExtraNote = d.ShowExtraNote;
        e.ShowRecipientPhone = d.ShowRecipientPhone; e.ShowSenderPhone = d.ShowSenderPhone; e.ShowQr = d.ShowQr;
        e.NoteFont = d.NoteFont; e.NoteBold = d.NoteBold; e.NoteFontStyle = d.NoteFontStyle;
        e.NoteFontSize = d.NoteFontSize; e.NoteColor = d.NoteColor; e.CardSize = d.CardSize; e.NoteContent = d.NoteContent;
        e.ElementsJson = d.ElementsJson;
    }

    private static PrintTemplateDto Map(PrintTemplate t) => new()
    {
        Id = t.Id, Name = t.Name, TemplateType = t.TemplateType, PaperType = t.PaperType, Rotation = t.Rotation,
        Theme = t.Theme, Style = t.Style, IsDefault = t.IsDefault,
        ShowOrderCode = t.ShowOrderCode, ShowCreatedDate = t.ShowCreatedDate, ShowPrice = t.ShowPrice,
        ShowPaymentStatus = t.ShowPaymentStatus, ShowExtraNote = t.ShowExtraNote,
        ShowRecipientPhone = t.ShowRecipientPhone, ShowSenderPhone = t.ShowSenderPhone, ShowQr = t.ShowQr,
        NoteFont = t.NoteFont, NoteBold = t.NoteBold, NoteFontStyle = t.NoteFontStyle,
        NoteFontSize = t.NoteFontSize, NoteColor = t.NoteColor, CardSize = t.CardSize, NoteContent = t.NoteContent,
        ElementsJson = t.ElementsJson,
    };
}
