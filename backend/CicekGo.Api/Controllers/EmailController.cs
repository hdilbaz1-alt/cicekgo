using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Email;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class EmailController : ControllerBase
{
    private readonly IEmailSettingsService _settings;
    public EmailController(IEmailSettingsService settings) => _settings = settings;

    [HttpGet("settings")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<EmailSettingsDto>>> GetSettings(CancellationToken ct)
        => Ok(ApiResponse<EmailSettingsDto>.Ok(await _settings.GetAsync(ct)));

    [HttpPut("settings")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<EmailSettingsDto>>> UpdateSettings([FromBody] UpdateEmailSettingsDto dto, CancellationToken ct)
        => Ok(ApiResponse<EmailSettingsDto>.Ok(await _settings.UpdateAsync(dto, ct), "Ayarlar kaydedildi. Lütfen bağlantıyı test edin."));

    [HttpPost("settings/test")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<EmailTestResultDto>>> TestSettings(CancellationToken ct)
    {
        var r = await _settings.TestAndVerifyAsync(ct);
        return Ok(r.Success
            ? ApiResponse<EmailTestResultDto>.Ok(r, "SMTP bağlantısı doğrulandı ✓")
            : ApiResponse<EmailTestResultDto>.Ok(r, r.Error ?? "Bağlantı başarısız"));
    }
}
