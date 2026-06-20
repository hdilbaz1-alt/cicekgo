namespace CicekGo.Application.Abstractions;

/// <summary>Aktif isteğin kimlik bilgileri (JWT claim'lerinden).</summary>
public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    int? UserId { get; }
    string? Username { get; }
    int? TenantId { get; }
    bool IsPlatformAdmin { get; }
    IReadOnlyCollection<string> Roles { get; }
    IReadOnlyCollection<string> Permissions { get; }
    bool HasPermission(string code);
}
