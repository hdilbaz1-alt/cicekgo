using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CicekGo.Application.Abstractions;
using CicekGo.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CicekGo.Infrastructure.Identity;

public class JwtTokenService : IJwtTokenService
{
    public const string ClaimUserId = "user_id";
    public const string ClaimUsername = "username";
    public const string ClaimTenantId = "tenant_id";
    public const string ClaimPlatformAdmin = "is_platform_admin";
    public const string ClaimRole = "roles";
    public const string ClaimPermission = "perms";

    private readonly JwtOptions _opt;

    public JwtTokenService(IOptions<JwtOptions> opt) => _opt = opt.Value;

    public TokenResult Create(int userId, string username, int? tenantId, bool isPlatformAdmin,
        IEnumerable<string> roles, IEnumerable<string> permissions)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_opt.ExpiresMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new(ClaimUserId, userId.ToString()),
            new(ClaimUsername, username),
            new(ClaimPlatformAdmin, isPlatformAdmin ? "true" : "false"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        if (tenantId.HasValue)
            claims.Add(new Claim(ClaimTenantId, tenantId.Value.ToString()));

        foreach (var r in roles.Distinct())
            claims.Add(new Claim(ClaimRole, r));

        foreach (var p in permissions.Distinct())
            claims.Add(new Claim(ClaimPermission, p));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opt.Issuer,
            audience: _opt.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: creds);

        return new TokenResult(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
