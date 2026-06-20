namespace CicekGo.Application.Printing;

public class PrintTemplateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string TemplateType { get; set; } = "Standart A4/A5";
    public string PaperType { get; set; } = "A5";
    public string Rotation { get; set; } = "Normal";
    public string Theme { get; set; } = "Tema 1";
    public string Style { get; set; } = "Stil 1";
    public bool IsDefault { get; set; }
    public bool ShowOrderCode { get; set; } = true;
    public bool ShowCreatedDate { get; set; } = true;
    public bool ShowPrice { get; set; } = true;
    public bool ShowPaymentStatus { get; set; } = true;
    public bool ShowExtraNote { get; set; } = true;
    public bool ShowRecipientPhone { get; set; } = true;
    public bool ShowSenderPhone { get; set; } = true;
    public bool ShowQr { get; set; } = true;
    public string NoteFont { get; set; } = "Varsayılan";
    public bool NoteBold { get; set; }
    public string NoteFontStyle { get; set; } = "Normal";
    public int NoteFontSize { get; set; } = 18;
    public string NoteColor { get; set; } = "#333333";
    public string CardSize { get; set; } = "Büyük Kart";
    public string NoteContent { get; set; } = "{{kart_notu}}";
    public string? ElementsJson { get; set; }
}

/// <summary>Create/Update için kullanılan DTO (Id update'te route'tan gelir).</summary>
public class PrintTemplateSaveDto
{
    public string Name { get; set; } = default!;
    public string TemplateType { get; set; } = "Standart A4/A5";
    public string PaperType { get; set; } = "A5";
    public string Rotation { get; set; } = "Normal";
    public string Theme { get; set; } = "Tema 1";
    public string Style { get; set; } = "Stil 1";
    public bool IsDefault { get; set; }
    public bool ShowOrderCode { get; set; } = true;
    public bool ShowCreatedDate { get; set; } = true;
    public bool ShowPrice { get; set; } = true;
    public bool ShowPaymentStatus { get; set; } = true;
    public bool ShowExtraNote { get; set; } = true;
    public bool ShowRecipientPhone { get; set; } = true;
    public bool ShowSenderPhone { get; set; } = true;
    public bool ShowQr { get; set; } = true;
    public string NoteFont { get; set; } = "Varsayılan";
    public bool NoteBold { get; set; }
    public string NoteFontStyle { get; set; } = "Normal";
    public int NoteFontSize { get; set; } = 18;
    public string NoteColor { get; set; } = "#333333";
    public string CardSize { get; set; } = "Büyük Kart";
    public string NoteContent { get; set; } = "{{kart_notu}}";
    public string? ElementsJson { get; set; }
}

public interface IPrintTemplateService
{
    Task<IReadOnlyList<PrintTemplateDto>> ListAsync(CancellationToken ct = default);
    Task<int> CreateAsync(PrintTemplateSaveDto dto, CancellationToken ct = default);
    Task UpdateAsync(int id, PrintTemplateSaveDto dto, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task SetDefaultAsync(int id, CancellationToken ct = default);
}
