using CicekGo.Api.Authorization;
using CicekGo.Application.Common;
using CicekGo.Application.Settings;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class StoreSettingsController : ControllerBase
{
    private readonly IStoreSettingsService _service;
    public StoreSettingsController(IStoreSettingsService service) => _service = service;

    // Teslimat slotlarını sipariş oluştururken herkes okuyabilmeli
    [HttpGet]
    public async Task<ActionResult<ApiResponse<StoreSettingsDto>>> Get(CancellationToken ct)
        => Ok(ApiResponse<StoreSettingsDto>.Ok(await _service.GetAsync(ct)));

    [HttpPut]
    [HasPermission(Permissions.SettingsManage)]
    public async Task<ActionResult<ApiResponse<StoreSettingsDto>>> Update([FromBody] StoreSettingsUpdateDto dto, CancellationToken ct)
        => Ok(ApiResponse<StoreSettingsDto>.Ok(await _service.UpdateAsync(dto, ct), "Çalışma saatleri güncellendi."));
}
