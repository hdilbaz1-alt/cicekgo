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
    private readonly IEmailTemplateService _templates;
    private readonly IEmailTriggerService _triggers;
    public EmailController(IEmailSettingsService settings, IEmailTemplateService templates, IEmailTriggerService triggers)
    {
        _settings = settings; _templates = templates; _triggers = triggers;
    }

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

    // ---- Şablonlar ----
    [HttpGet("templates")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmailTemplateDto>>>> Templates(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<EmailTemplateDto>>.Ok(await _templates.ListAsync(ct)));

    [HttpPost("templates")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> CreateTemplate([FromBody] UpsertEmailTemplateDto dto, CancellationToken ct)
        => Ok(ApiResponse<EmailTemplateDto>.Ok(await _templates.CreateAsync(dto, ct), "Şablon oluşturuldu.", 201));

    [HttpPut("templates/{id:int}")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<EmailTemplateDto>>> UpdateTemplate(int id, [FromBody] UpsertEmailTemplateDto dto, CancellationToken ct)
        => Ok(ApiResponse<EmailTemplateDto>.Ok(await _templates.UpdateAsync(id, dto, ct), "Şablon güncellendi."));

    [HttpDelete("templates/{id:int}")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<string>>> DeleteTemplate(int id, CancellationToken ct)
    {
        await _templates.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("deleted", "Şablon silindi."));
    }

    [HttpPost("templates/preview")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<PreviewResultDto>>> Preview([FromBody] PreviewRequestDto dto, CancellationToken ct)
        => Ok(ApiResponse<PreviewResultDto>.Ok(await _templates.PreviewAsync(dto, ct)));

    [HttpGet("merge-tags")]
    [HasPermission(Permissions.EmailManage)]
    public ActionResult<ApiResponse<IReadOnlyList<MergeTagDto>>> MergeTags()
        => Ok(ApiResponse<IReadOnlyList<MergeTagDto>>.Ok(_templates.MergeTags()));

    // ---- Durum eşleştirmeleri ----
    [HttpGet("triggers")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmailTriggerDto>>>> Triggers(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<EmailTriggerDto>>.Ok(await _triggers.ListAsync(ct)));

    [HttpPut("triggers/{statusId:int}/template")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<string>>> SetTriggerTemplate(int statusId, [FromBody] SetTriggerTemplateDto dto, CancellationToken ct)
    {
        await _triggers.SetTemplateAsync(statusId, dto.TemplateId, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Eşleştirme kaydedildi."));
    }

    [HttpPut("triggers/{statusId:int}/active")]
    [HasPermission(Permissions.EmailManage)]
    public async Task<ActionResult<ApiResponse<string>>> SetTriggerActive(int statusId, [FromBody] SetTriggerActiveDto dto, CancellationToken ct)
    {
        await _triggers.SetActiveAsync(statusId, dto.IsActive, ct);
        return Ok(ApiResponse<string>.Ok("ok", dto.IsActive ? "Eşleştirme aktif." : "Eşleştirme pasif."));
    }
}

