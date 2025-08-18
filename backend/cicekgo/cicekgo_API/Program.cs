using cicekgo_Business.Services;
using cicekgo_Data.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Controllers (JSON'da PascalCase korunsun)
builder.Services
    .AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = null);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("AllowAll", p => p
        .AllowAnyOrigin()
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// DI: Repository (factory ile conn string) + Service
builder.Services.AddScoped<IOrderRepository>(_ =>
    new OrderRepository(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IOrderService, OrderService>();

builder.Services.AddScoped<IUserAuthRepository>(_ =>
    new UserAuthRepository(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IUserAuthService, UserAuthService>();

var app = builder.Build();

// Swagger (sadece Development'ta aç)
// if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS yoksa kapalý kalsýn
// app.UseHttpsRedirection();

app.UseCors("AllowAll");
app.UseAuthorization();

app.MapControllers();

// Basit saðlýk kontrolü (opsiyonel)
// app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));

app.Run();
