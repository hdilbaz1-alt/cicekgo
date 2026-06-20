using Microsoft.AspNetCore.Mvc;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Auth.Dtos;
using cicekgo.Core.Common;

namespace cicekgo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserAuthService _authService;
    public AuthController(IUserAuthService authService) => _authService = authService;

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<LoginResultDto>>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponse<LoginResultDto>.Ok(result));
        }
        catch (UnauthorizedAccessException ex)
        {
            // ex.Message: "user is inactive" | "invalid credentials" | "tenant not found"
            return Unauthorized(ApiResponse<LoginResultDto>.Fail(ex.Message, 401));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<LoginResultDto>.Fail("unexpected error: " + ex.Message, 500));
        }
    }

}
