using CicekGo.Application.Abstractions;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using MimeKit;

namespace CicekGo.Infrastructure.Services;

/// <summary>Kiracının SMTP ayarını çözer ve MailKit ile mail yollar. Worker tarafından (HTTP dışı) kullanılır.</summary>
public sealed record ResolvedSmtp(
    string FromName, string FromEmail, string Host, int Port, string Security,
    string Username, string Password, int DailyLimit, bool IsVerified);

public interface IEmailSenderService
{
    Task<ResolvedSmtp?> ResolveAsync(int tenantId, CancellationToken ct = default);
    Task SendAsync(ResolvedSmtp smtp, EmailOutbox row, CancellationToken ct = default);
}

public class EmailSenderService : IEmailSenderService
{
    private readonly ITenantConnectionResolver _resolver;
    private readonly IDataProtector _protector;

    public EmailSenderService(ITenantConnectionResolver resolver, IDataProtectionProvider dp)
    {
        _resolver = resolver;
        _protector = dp.CreateProtector("email-smtp");
    }

    private static SecureSocketOptions ToOpt(string s) => s switch
    {
        "Ssl" => SecureSocketOptions.SslOnConnect,
        "None" => SecureSocketOptions.None,
        _ => SecureSocketOptions.StartTls,
    };

    public async Task<ResolvedSmtp?> ResolveAsync(int tenantId, CancellationToken ct = default)
    {
        var info = await _resolver.ResolveAsync(tenantId, ct);
        if (info?.ConnectionString is null) return null;

        var opts = new DbContextOptionsBuilder<TenantDbContext>()
            .UseNpgsql(info.ConnectionString).UseSnakeCaseNamingConvention().Options;
        await using var db = new TenantDbContext(opts);
        var s = await db.EmailSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        if (s is null || string.IsNullOrEmpty(s.SmtpPasswordEnc)) return null;

        string pwd;
        try { pwd = _protector.Unprotect(s.SmtpPasswordEnc); }
        catch { return null; } // anahtar değişmiş → çözülemez

        return new ResolvedSmtp(s.FromName, s.FromEmail, s.SmtpHost, s.SmtpPort, s.SmtpSecurity,
            s.SmtpUsername, pwd, s.DailyLimit <= 0 ? 500 : s.DailyLimit, s.IsVerified);
    }

    public async Task SendAsync(ResolvedSmtp smtp, EmailOutbox row, CancellationToken ct = default)
    {
        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(smtp.FromName, smtp.FromEmail));
        msg.To.Add(MailboxAddress.Parse(row.ToEmail));
        msg.Subject = row.Subject;
        msg.Body = new BodyBuilder { HtmlBody = row.HtmlBody }.ToMessageBody();

        using var client = new SmtpClient { Timeout = 20000 };
        await client.ConnectAsync(smtp.Host, smtp.Port, ToOpt(smtp.Security), ct);
        await client.AuthenticateAsync(smtp.Username, smtp.Password, ct);
        await client.SendAsync(msg, ct);
        await client.DisconnectAsync(true, ct);
    }
}
