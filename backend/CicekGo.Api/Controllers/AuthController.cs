using CicekGo.Application.Auth;
using CicekGo.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResultDto>>> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var result = await _auth.LoginAsync(request, ct);
        return Ok(ApiResponse<LoginResultDto>.Ok(result));
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<RefreshResultDto>>> Refresh([FromBody] RefreshRequestDto request, CancellationToken ct)
    {
        var result = await _auth.RefreshAsync(request.RefreshToken, ct);
        return Ok(ApiResponse<RefreshResultDto>.Ok(result));
    }
}
