using System.Security.Claims;
using CicekGo.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace CicekGo.Infrastructure.Identity;

public class CurrentUser : ICurrentUser
{
    private readonly ClaimsPrincipal _principal;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _principal = accessor.HttpContext?.User ?? new ClaimsPrincipal();
    }

    public bool IsAuthenticated => _principal.Identity?.IsAuthenticated == true;

    public int? UserId =>
        int.TryParse(_principal.FindFirstValue(JwtTokenService.ClaimUserId), out var id) ? id : null;

    public string? Username => _principal.FindFirstValue(JwtTokenService.ClaimUsername);

    public int? TenantId =>
        int.TryParse(_principal.FindFirstValue(JwtTokenService.ClaimTenantId), out var id) ? id : null;

    public bool IsPlatformAdmin =>
        string.Equals(_principal.FindFirstValue(JwtTokenService.ClaimPlatformAdmin), "true", StringComparison.OrdinalIgnoreCase);

    public IReadOnlyCollection<string> Roles =>
        _principal.FindAll(JwtTokenService.ClaimRole).Select(c => c.Value).ToArray();

    public IReadOnlyCollection<string> Permissions =>
        _principal.FindAll(JwtTokenService.ClaimPermission).Select(c => c.Value).ToArray();

    public bool HasPermission(string code) =>
        IsPlatformAdmin || _principal.FindAll(JwtTokenService.ClaimPermission).Any(c => c.Value == code);
}
