namespace CicekGo.Application.Abstractions;

public record TokenResult(string Token, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    TokenResult Create(
        int userId,
        string username,
        int? tenantId,
        bool isPlatformAdmin,
        IEnumerable<string> roles,
        IEnumerable<string> permissions);
}
