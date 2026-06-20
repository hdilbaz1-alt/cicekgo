using System.Security.Claims;

namespace cicekgo.Business.Common.Interfaces;

public interface ICurrentUser
{
    int? UserId { get; }
    string? UserName { get; }
    ClaimsPrincipal Principal { get; }
}
