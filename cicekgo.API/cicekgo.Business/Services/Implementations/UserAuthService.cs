using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Auth.Dtos;
using cicekgo.Data.Repositories.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace cicekgo.Business.Services.Implementations
{
    public class UserAuthService : IUserAuthService
    {
        private readonly IUserAuthRepository _repo;
        private readonly JwtOptions _jwt;

        public UserAuthService(IUserAuthRepository repo, IOptions<JwtOptions> jwtOptions)
        {
            _repo = repo;
            _jwt = jwtOptions.Value;
        }

        public async Task<LoginResultDto> LoginAsync(LoginRequestDto request)
        {
            var user = await _repo.GetByUserNameAsync(request.UserName);
            if (user is null)
                throw new UnauthorizedAccessException("invalid credentials");

            if (!user.IsActive)
                throw new UnauthorizedAccessException("user is inactive");

            if (!VerifyPassword(request.Password, user.PasswordSalt, user.PasswordHash))
                throw new UnauthorizedAccessException("invalid credentials");

            var tenantId = await _repo.GetUserDefaultTenantIdAsync(user.Id)
                           ?? throw new UnauthorizedAccessException("tenant not found");

            // >>> ID + Name çeken yeni metotlar
            var rolesDetailed = (await _repo.GetUserRolesDetailedAsync(user.Id)).ToList();
            var specialDetailed = (await _repo.GetUserSpecialRolesDetailedAsync(user.Id)).ToList();

            // Yetkilendirme [Authorize(Roles="Admin")] için isim claims (eski davranışı koruyoruz)
            var roleNames = rolesDetailed.Select(r => r.Name).ToArray();
            var specialNames = specialDetailed.Select(r => r.Name).ToArray();

            // Ek claim: id listeleri (virgülle)
            var roleIdsCsv = string.Join(",", rolesDetailed.Select(r => r.Id));
            var specialIdsCsv = string.Join(",", specialDetailed.Select(r => r.Id));

            var now = DateTime.UtcNow;
            var expires = now.AddMinutes(_jwt.ExpiresMinutes);

            var claims = new List<Claim>
            {
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.UniqueName, user.UserName),
                new("username", user.UserName),
                new("user_id", user.Id.ToString()),
                new("tenant_id", tenantId.ToString()),
                new(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),

                // <<< ID listeleri ek:
                new("role_ids", roleIdsCsv),
                new("special_role_ids", specialIdsCsv),
            };

            // İsim bazlı rol claim'leri de ekle (Authorize(Roles="...") için gerekli)
            foreach (var r in roleNames) claims.Add(new Claim("roles", r));
            foreach (var s in specialNames) claims.Add(new Claim("special_roles", s));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _jwt.Issuer,
                audience: _jwt.Audience,
                claims: claims,
                notBefore: now,
                expires: expires,
                signingCredentials: creds);

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
            await _repo.UpdateLastLoginAsync(user.Id, DateTime.UtcNow);

            return new LoginResultDto
            {
                Token = tokenString,
                ExpiresAt = expires,
                UserId = user.Id,
                UserName = user.UserName,
                TenantId = tenantId,

                // >>> Response artık ID+Name
                Roles = rolesDetailed,
                SpecialRoles = specialDetailed
            };
        }

        private static bool VerifyPassword(string password, byte[] salt, byte[] expectedHash)
        {
            const int hashSize = 32;       // varbinary(32)
            const int iterations = 100000; // PBKDF2 rounds
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            var computed = pbkdf2.GetBytes(hashSize);
            return CryptographicOperations.FixedTimeEquals(computed, expectedHash);
        }
    }
}
