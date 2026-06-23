using CicekGo.Application.Common;
using CicekGo.Application.Email;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CicekGo.Infrastructure.Services;

public class EmailSettingsService : IEmailSettingsService
{
    private readonly TenantDbContext _db;
    private readonly IDataProtector _protector;
    private readonly ILogger<EmailSettingsService> _log;

    public EmailSettingsService(TenantDbContext db, IDataProtectionProvider dp, ILogger<EmailSettingsService> log)
    {
        _db = db;
        _protector = dp.CreateProtector("email-smtp");
        _log = log;
    }

    private static SecureSocketOptions ToSocketOptions(string security) => security switch
    {
        "Ssl" => SecureSocketOptions.SslOnConnect,
        "None" => SecureSocketOptions.None,
        _ => SecureSocketOptions.StartTls,
    };

    private string? TryUnprotect(string? cipher)
    {
        if (string.IsNullOrEmpty(cipher)) return null;
        try { return _protector.Unprotect(cipher); }
        catch { _log.LogWarning("SMTP parolası çözülemedi (anahtar değişmiş olabilir)."); return null; }
    }

    public async Task<EmailSettingsDto> GetAsync(CancellationToken ct = default)
    {
        var s = await _db.EmailSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        if (s is null) return new EmailSettingsDto { Configured = false };
        return new EmailSettingsDto
        {
            FromName = s.FromName, FromEmail = s.FromEmail,
            SmtpHost = s.SmtpHost, SmtpPort = s.SmtpPort, SmtpSecurity = s.SmtpSecurity, SmtpUsername = s.SmtpUsername,
            HasSmtpPassword = !string.IsNullOrEmpty(s.SmtpPasswordEnc),
            ImapHost = s.ImapHost, ImapPort = s.ImapPort, ImapUsername = s.ImapUsername,
            HasImapPassword = !string.IsNullOrEmpty(s.ImapPasswordEnc),
            SendToRecipient = s.SendToRecipient, SendToSender = s.SendToSender,
            IsVerified = s.IsVerified, VerifiedAtUtc = s.VerifiedAtUtc, DailyLimit = s.DailyLimit,
            Configured = true,
        };
    }

    public async Task<EmailSettingsDto> UpdateAsync(UpdateEmailSettingsDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.SmtpHost)) throw new AppException("SMTP sunucusu (host) gerekli.");
        if (string.IsNullOrWhiteSpace(dto.FromEmail)) throw new AppException("Gönderen e-posta gerekli.");

        var s = await _db.EmailSettings.FirstOrDefaultAsync(ct);
        var creating = s is null;
        s ??= new EmailSettings { CreatedAtUtc = DateTime.UtcNow };

        s.FromName = dto.FromName?.Trim() ?? "";
        s.FromEmail = dto.FromEmail.Trim();
        s.SmtpHost = dto.SmtpHost.Trim();
        s.SmtpPort = dto.SmtpPort;
        s.SmtpSecurity = dto.SmtpSecurity;
        s.SmtpUsername = dto.SmtpUsername?.Trim() ?? "";
        if (!string.IsNullOrEmpty(dto.SmtpPassword)) s.SmtpPasswordEnc = _protector.Protect(dto.SmtpPassword);
        s.ImapHost = dto.ImapHost?.Trim();
        s.ImapPort = dto.ImapPort;
        s.ImapUsername = dto.ImapUsername?.Trim();
        if (!string.IsNullOrEmpty(dto.ImapPassword)) s.ImapPasswordEnc = _protector.Protect(dto.ImapPassword);
        s.SendToRecipient = dto.SendToRecipient;
        s.SendToSender = dto.SendToSender;
        s.DailyLimit = dto.DailyLimit <= 0 ? 500 : dto.DailyLimit;
        // Bağlantıyı etkileyen değişiklik → yeniden doğrulama zorunlu
        s.IsVerified = false;
        s.VerifiedAtUtc = null;
        s.UpdatedAtUtc = DateTime.UtcNow;

        if (creating) _db.EmailSettings.Add(s);
        await _db.SaveChangesAsync(ct);
        return await GetAsync(ct);
    }

    public async Task<EmailTestResultDto> TestAndVerifyAsync(CancellationToken ct = default)
    {
        var s = await _db.EmailSettings.FirstOrDefaultAsync(ct);
        if (s is null) return new EmailTestResultDto { Success = false, Error = "Önce SMTP ayarlarını kaydedin." };
        var pwd = TryUnprotect(s.SmtpPasswordEnc);
        if (string.IsNullOrEmpty(pwd)) return new EmailTestResultDto { Success = false, Error = "SMTP parolası tanımlı değil." };

        try
        {
            using var client = new SmtpClient { Timeout = 15000 };
            await client.ConnectAsync(s.SmtpHost, s.SmtpPort, ToSocketOptions(s.SmtpSecurity), ct);
            await client.AuthenticateAsync(s.SmtpUsername, pwd, ct);
            await client.DisconnectAsync(true, ct);

            s.IsVerified = true;
            s.VerifiedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return new EmailTestResultDto { Success = true };
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "SMTP testi başarısız: {Host}", s.SmtpHost);
            return new EmailTestResultDto { Success = false, Error = ex.Message };
        }
    }
}
