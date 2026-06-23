namespace CicekGo.Application.Email;

/// <summary>SMTP/IMAP ayarları — yanıt (parolalar dönmez, yalnız "tanımlı mı" bilgisi).</summary>
public class EmailSettingsDto
{
    public string FromName { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string SmtpSecurity { get; set; } = "StartTls";
    public string SmtpUsername { get; set; } = "";
    public bool HasSmtpPassword { get; set; }
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public bool HasImapPassword { get; set; }
    public bool SendToRecipient { get; set; } = true;
    public bool SendToSender { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
    public int DailyLimit { get; set; } = 500;
    public bool Configured { get; set; }   // kayıt var mı
}

/// <summary>SMTP/IMAP ayarları — güncelleme. Parola boş gelirse mevcut korunur.</summary>
public class UpdateEmailSettingsDto
{
    public string FromName { get; set; } = default!;
    public string FromEmail { get; set; } = default!;
    public string SmtpHost { get; set; } = default!;
    public int SmtpPort { get; set; } = 587;
    public string SmtpSecurity { get; set; } = "StartTls";
    public string SmtpUsername { get; set; } = default!;
    public string? SmtpPassword { get; set; }
    public string? ImapHost { get; set; }
    public int? ImapPort { get; set; }
    public string? ImapUsername { get; set; }
    public string? ImapPassword { get; set; }
    public bool SendToRecipient { get; set; } = true;
    public bool SendToSender { get; set; }
    public int DailyLimit { get; set; } = 500;
}

public class EmailTestResultDto
{
    public bool Success { get; set; }
    public string? Error { get; set; }
}

public interface IEmailSettingsService
{
    Task<EmailSettingsDto> GetAsync(CancellationToken ct = default);
    Task<EmailSettingsDto> UpdateAsync(UpdateEmailSettingsDto dto, CancellationToken ct = default);
    Task<EmailTestResultDto> TestAndVerifyAsync(CancellationToken ct = default);
}
