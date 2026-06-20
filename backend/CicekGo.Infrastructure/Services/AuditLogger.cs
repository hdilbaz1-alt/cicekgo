using System.Text.Json;
using CicekGo.Application.Abstractions;
using CicekGo.Domain.Tenant;
using CicekGo.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;

namespace CicekGo.Infrastructure.Services;

public class AuditLogger : IAuditLogger
{
    private readonly TenantDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IHttpContextAccessor _http;

    public AuditLogger(TenantDbContext db, ICurrentUser current, IHttpContextAccessor http)
    {
        _db = db;
        _current = current;
        _http = http;
    }

    public async Task LogAsync(string actionType, string module, string? entityType = null, string? entityId = null,
        string? description = null, object? oldValues = null, object? newValues = null, CancellationToken ct = default)
    {
        var ctx = _http.HttpContext;
        var log = new AuditLog
        {
            UserId = _current.UserId,
            UserFullName = _current.Username,
            ActionType = actionType,
            ModuleName = module,
            EntityType = entityType,
            EntityId = entityId,
            Description = description,
            OldValuesJson = oldValues is null ? null : JsonSerializer.Serialize(oldValues),
            NewValuesJson = newValues is null ? null : JsonSerializer.Serialize(newValues),
            IpAddress = ctx?.Connection.RemoteIpAddress?.ToString(),
            UserAgent = ctx?.Request.Headers.UserAgent.ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }
}
