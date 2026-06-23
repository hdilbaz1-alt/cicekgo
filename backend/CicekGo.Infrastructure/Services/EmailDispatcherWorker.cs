using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CicekGo.Infrastructure.Services;

/// <summary>Outbox'ı drenajlar: kiracı SMTP'sini çözer, mail yollar; retry/backoff/dead-letter + günlük limit.</summary>
public class EmailDispatcherWorker : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly EmailQueueSignal _signal;
    private readonly ILogger<EmailDispatcherWorker> _log;
    private const int BatchSize = 20;

    public EmailDispatcherWorker(IServiceProvider sp, EmailQueueSignal signal, ILogger<EmailDispatcherWorker> log)
    {
        _sp = sp; _signal = signal; _log = log;
    }

    private static int BackoffMinutes(int attempt) => attempt switch { 1 => 1, 2 => 5, 3 => 30, 4 => 120, _ => 360 };

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        // başlangıçta kısa bekleme (uygulama tam ayağa kalksın)
        try { await Task.Delay(TimeSpan.FromSeconds(8), ct); } catch { return; }
        while (!ct.IsCancellationRequested)
        {
            try { await _signal.WaitAsync(TimeSpan.FromSeconds(30), ct); } catch (OperationCanceledException) { break; }
            try { await DrainAsync(ct); }
            catch (Exception ex) { _log.LogError(ex, "E-posta drenajı hatası"); }
        }
    }

    private async Task DrainAsync(CancellationToken ct)
    {
        var smtpCache = new Dictionary<int, ResolvedSmtp?>();
        var sentToday = new Dictionary<int, int>();
        var todayUtc = DateTime.UtcNow.Date;

        while (!ct.IsCancellationRequested)
        {
            using var scope = _sp.CreateScope();
            var master = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
            var sender = scope.ServiceProvider.GetRequiredService<IEmailSenderService>();

            var now = DateTime.UtcNow;
            var batch = await master.EmailOutbox
                .Where(x => (x.Status == "Pending" || x.Status == "Failed") && x.NextAttemptUtc <= now)
                .OrderBy(x => x.Id).Take(BatchSize).ToListAsync(ct);
            if (batch.Count == 0) break;

            foreach (var row in batch)
            {
                if (!smtpCache.TryGetValue(row.TenantId, out var smtp))
                {
                    smtp = await sender.ResolveAsync(row.TenantId, ct);
                    smtpCache[row.TenantId] = smtp;
                    if (smtp is not null && !sentToday.ContainsKey(row.TenantId))
                        sentToday[row.TenantId] = await master.EmailOutbox.CountAsync(
                            x => x.TenantId == row.TenantId && x.Status == "Sent" && x.SentAtUtc >= todayUtc, ct);
                }

                if (smtp is null || !smtp.IsVerified)
                {
                    row.AttemptCount++; row.LastError = "SMTP ayarı yok/doğrulanmamış/çözülemedi";
                    row.Status = row.AttemptCount >= row.MaxAttempts ? "Dead" : "Failed";
                    row.NextAttemptUtc = now.AddMinutes(BackoffMinutes(row.AttemptCount));
                    continue;
                }

                // Günlük limit
                if (sentToday.TryGetValue(row.TenantId, out var cnt) && cnt >= smtp.DailyLimit)
                {
                    row.NextAttemptUtc = todayUtc.AddDays(1); // yarın tekrar dene
                    row.LastError = "Günlük gönderim limitine ulaşıldı";
                    continue;
                }

                try
                {
                    await sender.SendAsync(smtp, row, ct);
                    row.Status = "Sent"; row.SentAtUtc = DateTime.UtcNow; row.LastError = null;
                    sentToday[row.TenantId] = (sentToday.TryGetValue(row.TenantId, out var c) ? c : 0) + 1;
                }
                catch (Exception ex)
                {
                    row.AttemptCount++; row.LastError = ex.Message;
                    row.Status = row.AttemptCount >= row.MaxAttempts ? "Dead" : "Failed";
                    row.NextAttemptUtc = now.AddMinutes(BackoffMinutes(row.AttemptCount));
                    _log.LogWarning(ex, "E-posta gönderilemedi (outbox {Id}, deneme {N})", row.Id, row.AttemptCount);
                }
            }

            await master.SaveChangesAsync(ct);
            if (batch.Count < BatchSize) break;
        }
    }
}
