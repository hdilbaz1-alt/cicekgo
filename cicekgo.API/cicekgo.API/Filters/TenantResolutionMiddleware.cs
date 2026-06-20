using cicekgo.Data.Common.Interfaces;

namespace cicekgo.API.Filters;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    public TenantResolutionMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantResolver resolver)
    {
        // Sadece authenticated isteklerde tenant çöz
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            await resolver.ResolveAsync();
        }

        await _next(context);
    }
}

public static class TenantResolutionExtensions
{
    public static IApplicationBuilder UseTenantResolution(this IApplicationBuilder app)
        => app.UseMiddleware<TenantResolutionMiddleware>();
}
