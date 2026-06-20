using System.Data;

namespace cicekgo.Data.Common.Interfaces;

public interface ITenantDbFactory
{
    IDbConnection CreateConnection();
}
