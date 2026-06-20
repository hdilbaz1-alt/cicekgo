using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Data.Common.Interfaces
{
    public interface IIdentityDbFactory
    {
        IDbConnection CreateConnection();
    }
}
