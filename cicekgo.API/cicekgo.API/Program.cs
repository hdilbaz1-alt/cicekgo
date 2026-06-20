using cicekgo.API.Filters;
using cicekgo.Business.Common.Implementations;
using cicekgo.Business.Common.Interfaces;
using cicekgo.Business.Services.Implementations;
using cicekgo.Business.Services.Interfaces;
using cicekgo.Core.Auth.Dtos;
using cicekgo.Data.Common.Implementations;
using cicekgo.Data.Common.Interfaces;
using cicekgo.Data.Repositories.Implementations;
using cicekgo.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ===== Options =====
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

// ===== MemoryCache + HttpContext =====
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

// ===== Identity DB factory =====
builder.Services.AddSingleton<IIdentityDbFactory, IdentityDbFactory>();

// ===== Tenant context/resolver/factory =====
builder.Services.AddScoped<ITenantContext, TenantContext>();
builder.Services.AddScoped<ITenantResolver, TenantResolver>();
builder.Services.AddScoped<ITenantDbFactory, TenantDbFactory>();

// ===== Repositories =====
builder.Services.AddScoped<IUserAuthRepository, UserAuthRepository>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();

// ===== Services =====
builder.Services.AddScoped<IUserAuthService, UserAuthService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IOrderCodeRepository, OrderCodeRepository>();
builder.Services.AddScoped<IOrderCodeService, OrderCodeService>();
builder.Services.AddScoped<IProductTypeRepository, ProductTypeRepository>();
builder.Services.AddScoped<IProductTypeService, ProductTypeService>();
builder.Services.AddScoped<IOrderStatusRepository, OrderStatusRepository>();
builder.Services.AddScoped<IOrderStatusService, OrderStatusService>();


// ===== CORS =====
const string AllowAll = "AllowAll";
const string FrontendOnly = "FrontendOnly";

builder.Services.AddCors(options =>
{
    // DEV ortamı için tamamen açık
    options.AddPolicy(AllowAll, policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });

    // PROD ortamı için sadece belirli origin'ler
    options.AddPolicy(FrontendOnly, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://localhost:3000",
                "https://app.cicekgo.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ===== JWT =====
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>()!;
var keyBytes = Encoding.UTF8.GetBytes(jwt.Key);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = false; // PROD'da true yap
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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ===== Swagger + JWT Bearer =====
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "cicekgo API",
        Version = "v1"
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Bearer token giriniz. Örn: Bearer eyJhbGciOi...",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();

// ===== Swagger her ortamda açık =====
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "cicekgo API v1");
    c.RoutePrefix = "swagger"; // http://.../swagger
});

// ===== Pipeline Sırası =====
app.UseHttpsRedirection();

app.UseRouting();

app.UseCors(AllowAll); // DEV ortamı
// app.UseCors(FrontendOnly); // PROD ortamında aç

app.UseAuthentication();
app.UseTenantResolution();
app.UseAuthorization();

app.MapControllers();

app.Run();
