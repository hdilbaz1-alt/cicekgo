using CicekGo.Application.Abstractions;
using Microsoft.AspNetCore.Identity;

namespace CicekGo.Infrastructure.Identity;

/// <summary>ASP.NET Core PasswordHasher (PBKDF2) sarmalayıcısı.</summary>
public class PasswordHasher : IPasswordHasher
{
    private readonly PasswordHasher<object> _inner = new();
    private static readonly object Dummy = new();

    public string Hash(string password) => _inner.HashPassword(Dummy, password);

    public bool Verify(string password, string hash)
    {
        var result = _inner.VerifyHashedPassword(Dummy, hash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
