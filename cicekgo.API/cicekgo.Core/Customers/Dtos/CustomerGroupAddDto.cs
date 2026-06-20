using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerGroupAddDto
    {
        public string GroupName { get; set; } = null!;
        public string? Description { get; set; }
    }
}
