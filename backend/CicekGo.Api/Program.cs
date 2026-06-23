using System.IdentityModel.Tokens.Jwt;
using System.Text;
using CicekGo.Api.Authorization;
using CicekGo.Api.Middleware;
using CicekGo.Infrastructure;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Seed;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear(); // custom claim adlarını koru

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg.ReadFrom.Configuration(ctx.Configuration).WriteTo.Console());

// ===== Infrastructure (DB, servisler, JWT/hasher) =====
builder.Services.AddInfrastructure(builder.Configuration);

// ===== JWT Authentication =====
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt yapılandırması eksik.");
var keyBytes = Encoding.UTF8.GetBytes(jwt.Key);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.RequireHttpsMetadata = false;
        o.SaveToken = true;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

// ===== Permission-based authorization =====
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization();

// ===== CORS =====
const string CorsPolicy = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        if (origins is { Length: > 0 })
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
        else
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.Converters.Add(new CicekGo.Api.Json.UtcDateTimeConverter());
    o.JsonSerializerOptions.Converters.Add(new CicekGo.Api.Json.NullableUtcDateTimeConverter());
});
builder.Services.AddEndpointsApiExplorer();

// ===== Swagger + Bearer =====
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ÇiçekGo API", Version = "v1" });
    var scheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
    };
    c.AddSecurityDefinition("Bearer", scheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { scheme, Array.Empty<string>() } });
});

var app = builder.Build();

// ===== Master DB migrate + seed =====
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<MasterSeeder>();
    await seeder.RunAsync();

    // VAPID anahtarlarını (Web Push) yoksa üret
    var platform = scope.ServiceProvider.GetRequiredService<CicekGo.Application.Platform.IPlatformSettingsService>();
    await platform.EnsureVapidAsync();

    // Mevcut firma DB'lerine bekleyen şema güncellemelerini uygula
    var tenantMigrator = scope.ServiceProvider.GetRequiredService<CicekGo.Infrastructure.Provisioning.TenantMigrator>();
    await tenantMigrator.MigrateAllAsync();
}

app.UseExceptionHandling();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ÇiçekGo API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors(CorsPolicy);

app.UseAuthentication();
app.UseTenantResolution();
app.UseAuthorization();

app.MapControllers();

app.Run();
