using CicekGo.Application.Abstractions;
using CicekGo.Application.Email;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CicekGo.Infrastructure.Services;

/// <summary>Sipariş durumu değişince aktif tetikleyiciyi bulur, içeriği render eder ve master outbox'a yazar.</summary>
public class EmailDispatcher : IEmailDispatcher
{
    private readonly TenantDbContext _db;
    private readonly MasterDbContext _master;
    private readonly ICurrentUser _current;
    private readonly EmailQueueSignal _signal;
    private readonly ILogger<EmailDispatcher> _log;

    public EmailDispatcher(TenantDbContext db, MasterDbContext master, ICurrentUser current, EmailQueueSignal signal, ILogger<EmailDispatcher> log)
    {
        _db = db; _master = master; _current = current; _signal = signal; _log = log;
    }

    public async Task EnqueueForOrderStatusAsync(int orderId, CancellationToken ct = default)
    {
        var tenantId = _current.TenantId;
        if (tenantId is null) return;

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) return;

        var settings = await _db.EmailSettings.AsNoTracking().FirstOrDefaultAsync(ct);
        if (settings is null || !settings.IsVerified) return;

        var trig = await _db.OrderStatusEmailTriggers.AsNoTracking()
            .Include(t => t.OrderStatus).Include(t => t.Template)
            .FirstOrDefaultAsync(t => t.IsActive && t.OrderStatus!.Name == order.Status, ct);
        if (trig?.Template is null) return;

        // Hedefler: switch açık VE ilgili e-posta dolu
        var targets = new List<(string Audience, string Email)>();
        if (settings.SendToRecipient && !string.IsNullOrWhiteSpace(order.RecipientEmail)) targets.Add(("recipient", order.RecipientEmail!.Trim()));
        if (settings.SendToSender && !string.IsNullOrWhiteSpace(order.SenderEmail)) targets.Add(("sender", order.SenderEmail!.Trim()));
        if (targets.Count == 0) return;

        var items = await _db.OrderItems.AsNoTracking().Where(i => i.OrderId == order.Id).ToListAsync(ct);
        var model = EmailMergeModel.Build(order, items, string.IsNullOrWhiteSpace(settings.FromName) ? "ÇiçekGo" : settings.FromName);
        var subject = EmailRenderer.Render(trig.Template.Subject, model);
        var html = EmailRenderer.Render(trig.Template.HtmlBody, model);

        var added = false;
        foreach (var (audience, email) in targets)
        {
            var dedup = $"{tenantId}:{order.Id}:{trig.OrderStatusId}:{trig.TemplateId}:{audience}";
            if (await _master.EmailOutbox.AnyAsync(x => x.DedupKey == dedup, ct)) continue;
            _master.EmailOutbox.Add(new EmailOutbox
            {
                TenantId = tenantId.Value, OrderId = order.Id, OrderCode = order.Code, Audience = audience,
                ToEmail = email, Subject = subject, HtmlBody = html, Status = "Pending",
                NextAttemptUtc = DateTime.UtcNow, DedupKey = dedup, CreatedAtUtc = DateTime.UtcNow,
            });
            added = true;
        }
        if (added)
        {
            await _master.SaveChangesAsync(ct);
            _signal.Signal();
            _log.LogInformation("E-posta kuyruğa alındı: order {Code}, status {Status}", order.Code, order.Status);
        }
    }
}
