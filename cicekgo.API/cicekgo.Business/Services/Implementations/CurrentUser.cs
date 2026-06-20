using System.Security.Claims;
using cicekgo.Business.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace cicekgo.Business.Common.Implementations;

public class CurrentUser : ICurrentUser
{
    public ClaimsPrincipal Principal { get; }

    public CurrentUser(IHttpContextAccessor accessor)
    {
        Principal = accessor.HttpContext?.User ?? new ClaimsPrincipal();
    }

    public int? UserId
        => int.TryParse(Principal.FindFirstValue("user_id") ?? Principal.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
           ? id : null;

    public string? UserName
        => Principal.FindFirstValue("username")
           ?? Principal.FindFirstValue(ClaimTypes.Name)
           ?? Principal.Identity?.Name;
}
