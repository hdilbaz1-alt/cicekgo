using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.PaymentMethods;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PaymentMethodController : ControllerBase
{
    private readonly IPaymentMethodService _service;
    public PaymentMethodController(IPaymentMethodService service) => _service = service;

    // Listeleme: formlarda gerektiği için sadece kimlik doğrulaması yeterli
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentMethodDto>>>> List(CancellationToken ct)
        => Ok(ApiResponse<IReadOnlyList<PaymentMethodDto>>.Ok(await _service.ListAsync(ct)));

    [HttpPost("add")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<int>>> Add([FromBody] PaymentMethodSaveDto dto, CancellationToken ct)
        => Ok(ApiResponse<int>.Ok(await _service.CreateAsync(dto, ct), "Ödeme yöntemi eklendi.", 201));

    [HttpPut("update/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Update(int id, [FromBody] PaymentMethodSaveDto dto, CancellationToken ct)
    {
        await _service.UpdateAsync(id, dto, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Güncellendi."));
    }

    [HttpDelete("delete/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> Delete(int id, CancellationToken ct)
    {
        await _service.DeleteAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Silindi."));
    }

    [HttpPost("set-default/{id:int}")]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<string>>> SetDefault(int id, CancellationToken ct)
    {
        await _service.SetDefaultAsync(id, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Varsayılan ayarlandı."));
    }
}
