using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using cicekgo.Data.Common.Interfaces;

namespace cicekgo.Data.Common.Implementations;

public class IdentityDbFactory : IIdentityDbFactory
{
    private readonly string _cs;
    public IdentityDbFactory(IConfiguration configuration)
    {
        _cs = configuration.GetConnectionString("IdentityConnection")!;
    }
    public IDbConnection CreateConnection() => new SqlConnection(_cs);
}
