namespace CicekGo.Domain.Tenant;

/// <summary>Firma e-posta (SMTP/IMAP) ayarları. Parolalar şifreli (Data Protection) saklanır. Kiracı başına tek satır.</summary>
public class EmailSettings
{
    public int Id { get; set; }

    public string FromName { get; set; } = default!;
    public string FromEmail { get; set; } = default!;

    public string SmtpHost { get; set; } = default!;
    public int SmtpPort { get; set; } = 587;
    public string SmtpSecurity { get; set; } = "StartTls";   // None | Ssl | StartTls
    public string SmtpUsername { get; set; } = default!;
    public string SmtpPasswordEnc { get; set; } = default!;  // şifreli

    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public string? ImapPasswordEnc { get; set; }             // şifreli

    // Gönderim hedefleri (ayarlardan switch ile yönetilir)
    public bool SendToRecipient { get; set; } = true;
    public bool SendToSender { get; set; }

    public bool IsVerified { get; set; }                     // başarılı SMTP testinden sonra true
    public DateTime? VerifiedAtUtc { get; set; }
    public int DailyLimit { get; set; } = 500;               // kiracı günlük gönderim limiti

    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
