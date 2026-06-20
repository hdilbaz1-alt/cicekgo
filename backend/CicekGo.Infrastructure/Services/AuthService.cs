using CicekGo.Application.Abstractions;
using CicekGo.Application.Auth;
using CicekGo.Application.Common;
using CicekGo.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly MasterDbContext _master;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;

    public AuthService(MasterDbContext master, IPasswordHasher hasher, IJwtTokenService jwt)
    {
        _master = master;
        _hasher = hasher;
        _jwt = jwt;
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

        return new LoginResultDto
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAtUtc,
            UserId = user.Id,
            UserName = user.Username,
            TenantId = user.TenantId,
            Roles = roleDtos,
            SpecialRoles = new List<RoleItemDto>(),
            Permissions = perms
        };
    }
}
