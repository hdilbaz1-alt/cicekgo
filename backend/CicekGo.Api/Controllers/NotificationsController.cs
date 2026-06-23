using CicekGo.Api.Authorization;
using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;
using CicekGo.Application.Notifications;
using CicekGo.Application.Platform;
using CicekGo.Domain.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CicekGo.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly IPushSubscriptionService _subs;
    private readonly IPushNotificationService _push;
    private readonly INotificationFeedService _feed;
    private readonly IPlatformSettingsService _platform;
    private readonly ICurrentUser _current;

    public NotificationsController(IPushSubscriptionService subs, IPushNotificationService push,
        INotificationFeedService feed, IPlatformSettingsService platform, ICurrentUser current)
    {
        _subs = subs; _push = push; _feed = feed; _platform = platform; _current = current;
    }

    /// <summary>Kullanıcının kalıcı bildirim listesi (zil).</summary>
    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<List<NotificationItemDto>>>> List([FromQuery] int take = 50, CancellationToken ct = default)
    {
        if (_current.UserId is null) return Unauthorized();
        return Ok(ApiResponse<List<NotificationItemDto>>.Ok(await _feed.ListAsync(_current.UserId.Value, take, ct)));
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> UnreadCount(CancellationToken ct)
    {
        if (_current.UserId is null) return Unauthorized();
        return Ok(ApiResponse<int>.Ok(await _feed.UnreadCountAsync(_current.UserId.Value, ct)));
    }

    [HttpPost("{id:int}/read")]
    public async Task<ActionResult<ApiResponse<string>>> MarkRead(int id, CancellationToken ct)
    {
        if (_current.UserId is null) return Unauthorized();
        await _feed.MarkReadAsync(_current.UserId.Value, id, ct);
        return Ok(ApiResponse<string>.Ok("ok"));
    }

    [HttpPost("read-all")]
    public async Task<ActionResult<ApiResponse<string>>> MarkAllRead(CancellationToken ct)
    {
        if (_current.UserId is null) return Unauthorized();
        await _feed.MarkAllReadAsync(_current.UserId.Value, ct);
        return Ok(ApiResponse<string>.Ok("ok"));
    }

    /// <summary>Tarayıcı aboneliği için VAPID public key.</summary>
    [HttpGet("vapid-public-key")]
    public async Task<ActionResult<ApiResponse<string?>>> VapidPublicKey(CancellationToken ct)
        => Ok(ApiResponse<string?>.Ok((await _platform.EnsureVapidAsync(ct)).PublicKey));

    [HttpPost("subscribe")]
    public async Task<ActionResult<ApiResponse<string>>> Subscribe([FromBody] PushSubscribeDto dto, CancellationToken ct)
    {
        if (_current.UserId is null) return Unauthorized();
        await _subs.SaveAsync(_current.UserId.Value, _current.TenantId, dto, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Bildirim aboneliği kaydedildi."));
    }

    public class UnsubscribeDto { public string Endpoint { get; set; } = default!; }

    [HttpPost("unsubscribe")]
    public async Task<ActionResult<ApiResponse<string>>> Unsubscribe([FromBody] UnsubscribeDto dto, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(dto.Endpoint)) await _subs.DeleteAsync(dto.Endpoint, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Abonelik kaldırıldı."));
    }

    /// <summary>Toplu bildirim. Firma yöneticisi kendi firmasına; süperadmin tüm platforma / seçili firmaya.</summary>
    [HttpPost("broadcast")]
    [HasPermission(Permissions.NotificationsSend)]
    public async Task<ActionResult<ApiResponse<int>>> Broadcast([FromBody] BroadcastDto dto, CancellationToken ct)
    {
        var count = await _push.BroadcastAsync(dto, _current.TenantId, _current.IsPlatformAdmin, ct);
        return Ok(ApiResponse<int>.Ok(count, $"{count} cihaza gönderildi."));
    }

    /// <summary>Kullanıcıya kendi cihazlarına test bildirimi.</summary>
    [HttpPost("test")]
    public async Task<ActionResult<ApiResponse<string>>> Test(CancellationToken ct)
    {
        if (_current.UserId is null) return Unauthorized();
        await _push.SendToUserAsync(_current.UserId.Value,
            new NotificationPayload { Title = "ÇiçekGo", Body = "Test bildirimi 🎉", Url = "/" }, ct);
        return Ok(ApiResponse<string>.Ok("ok", "Test bildirimi gönderildi."));
    }
}
