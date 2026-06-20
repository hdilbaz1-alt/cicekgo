using CicekGo.Application.Abstractions;
using CicekGo.Application.Common;

namespace CicekGo.Api.Middleware;

/// <summary>
/// Authenticated isteklerde JWT'deki tenant_id'den firma DB bağlantısını çözer ve ITenantContext'i doldurur.
/// Lisans süresi dolmuş veya pasif firmada 403 döner.
/// </summary>
public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ICurrentUser current, ITenantContext tenantContext, ITenantConnectionResolver resolver)
    {
        if (current.IsAuthenticated && current.TenantId is int tenantId && !tenantContext.IsResolved)
        {
            var info = await resolver.ResolveAsync(tenantId, context.RequestAborted);
            if (info is null || !info.IsActive)
            {
                await WriteAsync(context, 401, "tenant not found or inactive");
                return;
            }

            if (info.LicenseEndUtc.HasValue && info.LicenseEndUtc.Value.Date < DateTime.UtcNow.Date)
            {
                await WriteAsync(context, 403, "license expired");
                return;
            }

            tenantContext.Set(info.TenantId, info.DbName, info.ConnectionString);
        }

        await _next(context);
    }

    private static async Task WriteAsync(HttpContext context, int status, string message)
    {
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message, status));
    }
}

public static class TenantResolutionMiddlewareExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder app)
        => app.UseMiddleware<TenantResolutionMiddleware>();
}
