using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerGroupMemberListDto
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public string GroupName { get; set; }
        public string Description { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
    }
}
