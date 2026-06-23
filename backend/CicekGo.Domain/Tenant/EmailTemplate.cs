namespace CicekGo.Domain.Tenant;

/// <summary>Firma e-posta şablonu (Canva-benzeri sürükle-bırak). design_json editör state'i, html_body gönderilecek HTML (placeholder'lı).</summary>
public class EmailTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;               // "Sipariş Hazırlanıyor Şablonu"
    public string Subject { get; set; } = default!;            // placeholder içerebilir
    public string? DesignJson { get; set; }                    // editör state (yeniden düzenleme)
    public string HtmlBody { get; set; } = default!;           // derlenmiş HTML (placeholder'lı)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
