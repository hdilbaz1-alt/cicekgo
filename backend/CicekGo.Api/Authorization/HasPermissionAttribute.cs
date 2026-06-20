using Microsoft.AspNetCore.Authorization;

namespace CicekGo.Api.Authorization;

/// <summary>Belirli bir izin koduna sahip olmayı gerektirir. Örn: [HasPermission(Permissions.OrdersManage)]</summary>
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "perm:";

    public HasPermissionAttribute(string permission) => Policy = PolicyPrefix + permission;
}
