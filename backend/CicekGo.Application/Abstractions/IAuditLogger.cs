namespace CicekGo.Application.Abstractions;

/// <summary>Kritik işlemleri firma DB'sindeki audit_logs tablosuna yazar.</summary>
public interface IAuditLogger
{
    Task LogAsync(
        string actionType,
        string module,
        string? entityType = null,
        string? entityId = null,
        string? description = null,
        object? oldValues = null,
        object? newValues = null,
        CancellationToken ct = default);
}
