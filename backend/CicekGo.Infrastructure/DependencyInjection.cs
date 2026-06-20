using CicekGo.Application.Abstractions;
using CicekGo.Application.Admin;
using CicekGo.Application.Auth;
using CicekGo.Application.Customers;
using CicekGo.Application.Orders;
using CicekGo.Application.Tenants;
using CicekGo.Infrastructure.Configuration;
using CicekGo.Infrastructure.Identity;
using CicekGo.Infrastructure.Persistence;
using CicekGo.Infrastructure.Provisioning;
using CicekGo.Infrastructure.Seed;
using CicekGo.Infrastructure.Services;
using CicekGo.Infrastructure.Tenancy;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CicekGo.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Options
        services.Configure<DatabaseOptions>(config.GetSection(DatabaseOptions.SectionName));
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.SectionName));
        services.Configure<SeedOptions>(config.GetSection(SeedOptions.SectionName));

        services.AddMemoryCache();
        services.AddHttpContextAccessor();

        var masterCs = config.GetSection(DatabaseOptions.SectionName)["MasterConnection"]
            ?? throw new InvalidOperationException("Database:MasterConnection yapılandırılmamış.");

        // Master DB
        services.AddDbContext<MasterDbContext>(options =>
            options.UseNpgsql(masterCs).UseSnakeCaseNamingConvention());

        // Tenant DB — bağlantı runtime'da ITenantContext'ten çözülür
        services.AddDbContext<TenantDbContext>((sp, options) =>
        {
            var tc = sp.GetRequiredService<ITenantContext>();
            if (!tc.IsResolved)
                throw new InvalidOperationException("Tenant context çözülmedi (yetkilendirme gerekli olabilir).");
            options.UseNpgsql(tc.ConnectionString!).UseSnakeCaseNamingConvention();
        });

        // Tenancy & identity
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<ITenantConnectionResolver, TenantConnectionResolver>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddScoped<ITenantProvisioner, TenantProvisioner>();
        services.AddScoped<IAuditLogger, AuditLogger>();

        // Application services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITenantInfoService, TenantInfoService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IOrderCodeService, OrderCodeService>();
        services.AddScoped<IOrderStatusService, OrderStatusService>();
        services.AddScoped<IProductTypeService, ProductTypeService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<ICustomerGroupService, CustomerGroupService>();
        services.AddScoped<ICustomerLedgerService, CustomerLedgerService>();
        services.AddScoped<Application.Refunds.IRefundService, RefundService>();
        services.AddScoped<Application.PaymentMethods.IPaymentMethodService, PaymentMethodService>();
        services.AddScoped<ITenantAdminService, TenantAdminService>();
        services.AddScoped<IUserAdminService, UserAdminService>();
        services.AddScoped<Application.Platform.IPlatformSettingsService, PlatformSettingsService>();
        services.AddScoped<Application.Products.IProductService, ProductService>();
        services.AddScoped<Application.Products.IStockService, StockService>();
        services.AddScoped<Application.Products.IUnitService, UnitService>();
        services.AddScoped<Application.Settings.IStoreSettingsService, StoreSettingsService>();
        services.AddScoped<Application.Tenants.ICompanyProfileService, CompanyProfileService>();
        services.AddScoped<Application.Finance.IExpenseService, ExpenseService>();
        services.AddScoped<Application.Finance.ICashService, CashService>();
        services.AddScoped<Application.Dashboard.IDashboardService, DashboardService>();
        services.AddScoped<Application.Reports.IReportService, ReportService>();
        services.AddScoped<Application.Audit.IAuditService, AuditService>();
        services.AddScoped<Application.Printing.IPrintTemplateService, PrintTemplateService>();
        services.AddScoped<Application.Account.IAccountService, AccountService>();

        // Seeder + tenant migrator
        services.AddScoped<MasterSeeder>();
        services.AddScoped<Provisioning.TenantMigrator>();

        return services;
    }
}
