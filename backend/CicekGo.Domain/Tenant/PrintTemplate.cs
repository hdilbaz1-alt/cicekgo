namespace CicekGo.Domain.Tenant;

/// <summary>Firma bazlı sipariş yazdırma şablonu (A4/A5).</summary>
public class PrintTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
    public string TemplateType { get; set; } = "Standart A4/A5";
    public string PaperType { get; set; } = "A5";       // A4 / A5
    public string Rotation { get; set; } = "Normal";    // Normal / Yatay
    public string Theme { get; set; } = "Tema 1";
    public string Style { get; set; } = "Stil 1";
    public bool IsDefault { get; set; }

    // Görüntülenecek alanlar
    public bool ShowOrderCode { get; set; } = true;
    public bool ShowCreatedDate { get; set; } = true;
    public bool ShowPrice { get; set; } = true;
    public bool ShowPaymentStatus { get; set; } = true;
    public bool ShowExtraNote { get; set; } = true;
    public bool ShowRecipientPhone { get; set; } = true;
    public bool ShowSenderPhone { get; set; } = true;
    public bool ShowQr { get; set; } = true;

    // Kart notu bölümü
    public string NoteFont { get; set; } = "Varsayılan";
    public bool NoteBold { get; set; }
    public string NoteFontStyle { get; set; } = "Normal";  // Normal / Italic / Script
    public int NoteFontSize { get; set; } = 18;
    public string NoteColor { get; set; } = "#333333";
    public string CardSize { get; set; } = "Büyük Kart";
    public string NoteContent { get; set; } = "{{kart_notu}}";

    // Serbest sürükle-bırak tasarım (Canva benzeri). Doluysa baskı bununla yapılır; null ise eski (sabit) düzen.
    public string? ElementsJson { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
