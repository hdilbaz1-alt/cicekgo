using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using cicekgo.Data.Common.Interfaces;

namespace cicekgo.Data.Common.Implementations;

public class TenantDbFactory : ITenantDbFactory
{
    private readonly ITenantContext _tenantContext;
    private readonly string _template;

    public TenantDbFactory(ITenantContext tenantContext, IConfiguration configuration)
    {
        _tenantContext = tenantContext;
        _template = configuration.GetConnectionString("TenantConnectionTemplate")!;
    }

    public IDbConnection CreateConnection()
    {
        if (!_tenantContext.TenantId.HasValue || string.IsNullOrWhiteSpace(_tenantContext.DbName))
            throw new InvalidOperationException("Tenant context set edilmemiş.");

        var cs = _template.Replace("{DBNAME}", _tenantContext.DbName!, StringComparison.OrdinalIgnoreCase);
        return new SqlConnection(cs);
    }
}
