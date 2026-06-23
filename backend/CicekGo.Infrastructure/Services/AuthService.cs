using System.Security.Cryptography;
using System.Text;
using CicekGo.Application.Abstractions;
using CicekGo.Application.Auth;
using CicekGo.Application.Common;
using CicekGo.Domain.Master;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class AuthService : IAuthService
{
    private const int RefreshDays = 30;
    private readonly MasterDbContext _master;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(MasterDbContext master, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _master = master;
        _hasher = hasher;
        _jwt = jwt;
    }

    private static string NewRefreshRaw() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace('+', '-').Replace('/', '_').TrimEnd('=');

    private static string HashToken(string raw) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));

    /// <summary>Kullanıcı için yeni refresh token üretir, hash'ini saklar, ham token'ı döndürür.</summary>
    private async Task<string> IssueRefreshTokenAsync(int userId, CancellationToken ct)
    {
        var raw = NewRefreshRaw();
        _master.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = HashToken(raw),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(RefreshDays),
        });
        await _master.SaveChangesAsync(ct);
        return raw;
    }

    public async Task<LoginResultDto> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
            throw new UnauthorizedException("invalid credentials");

        var user = await _master.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Username == request.UserName, ct);

        if (user is null || !_hasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("invalid credentials");

        if (!user.IsActive)
            throw new UnauthorizedException("user is inactive");

        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var roleDtos = roles.Select(r => new RoleItemDto { Id = r.Id, Name = r.Name }).ToList();

        var perms = roles
            .SelectMany(r => r.RolePermissions.Select(rp => rp.Permission.Code))
            .Distinct()
            .ToList();

        var token = _jwt.Create(user.Id, user.Username, user.TenantId, user.IsPlatformAdmin,
            roleDtos.Select(r => r.Name), perms);

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _master.SaveChangesAsync(ct);

        var refresh = await IssueRefreshTokenAsync(user.Id, ct);

        return new LoginResultDto
        {
            Token = token.Token,
            RefreshToken = refresh,
            ExpiresAt = token.ExpiresAtUtc,
            UserId = user.Id,
            UserName = user.Username,
            TenantId = user.TenantId,
            Roles = roleDtos,
            SpecialRoles = new List<RoleItemDto>(),
            Permissions = perms
        };
    }

    public async Task<RefreshResultDto> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            throw new UnauthorizedException("invalid refresh token");

        var hash = HashToken(refreshToken);
        var existing = await _master.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        // Reuse-detection: revoked bir token tekrar gelirse o kullanıcının tüm token'larını iptal et (çalıntı koruması).
        if (existing is not null && existing.RevokedAtUtc != null)
        {
            await _master.RefreshTokens.Where(t => t.UserId == existing.UserId && t.RevokedAtUtc == null)
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.RevokedAtUtc, DateTime.UtcNow), ct);
            throw new UnauthorizedException("refresh token reuse detected");
        }

        if (existing is null || DateTime.UtcNow >= existing.ExpiresAtUtc)
            throw new UnauthorizedException("invalid or expired refresh token");

        var user = await _master.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .ThenInclude(r => r.RolePermissions).ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Id == existing.UserId, ct);
        if (user is null || !user.IsActive)
            throw new UnauthorizedException("user not available");

        var roles = user.UserRoles.Select(ur => ur.Role).ToList();
        var perms = roles.SelectMany(r => r.RolePermissions.Select(rp => rp.Permission.Code)).Distinct().ToList();
        var access = _jwt.Create(user.Id, user.Username, user.TenantId, user.IsPlatformAdmin,
            roles.Select(r => r.Name), perms);

        // Rotation: eskiyi iptal et, yenisini ver
        var newRaw = NewRefreshRaw();
        existing.RevokedAtUtc = DateTime.UtcNow;
        existing.ReplacedByHash = HashToken(newRaw);
        _master.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = existing.ReplacedByHash,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(RefreshDays),
        });
        await _master.SaveChangesAsync(ct);

        return new RefreshResultDto { Token = access.Token, RefreshToken = newRaw, ExpiresAt = access.ExpiresAtUtc };
    }
}
