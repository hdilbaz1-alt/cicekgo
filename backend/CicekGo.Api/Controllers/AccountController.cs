using CicekGo.Application.Account;
using CicekGo.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AccountController : ControllerBase
{
    private readonly IAccountService _service;
    public AccountController(IAccountService service) => _service = service;

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<AccountMeDto>>> Me(CancellationToken ct)
        => Ok(ApiResponse<AccountMeDto>.Ok(await _service.GetMeAsync(ct)));

    [HttpPost("change-password")]
    public async Task<ActionResult<ApiResponse<string>>> ChangePassword([FromBody] ChangePasswordDto dto, CancellationToken ct)
    {
        await _service.ChangePasswordAsync(dto, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Şifre başarıyla değiştirildi."));
    }

    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<AccountMeDto>>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken ct)
        => Ok(ApiResponse<AccountMeDto>.Ok(await _service.UpdateProfileAsync(dto, ct), "Profil güncellendi."));

    [HttpDelete]
    public async Task<ActionResult<ApiResponse<string>>> DeleteAccount([FromBody] DeleteAccountDto dto, CancellationToken ct)
    {
        await _service.DeleteAccountAsync(dto, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Hesabınız silindi."));
    }
}
