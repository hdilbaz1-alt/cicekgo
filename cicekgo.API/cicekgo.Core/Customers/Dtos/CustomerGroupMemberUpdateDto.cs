using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerGroupMemberUpdateDto
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public int CustomerId { get; set; }
    }
}
