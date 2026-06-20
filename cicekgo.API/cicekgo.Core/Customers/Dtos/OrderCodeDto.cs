using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Core.Customers.Dtos
{
    public class OrderCodeDto
    {
        public int Id { get; set; }
        public string OrderStartCode { get; set; }
        public string OrderLastCode { get; set; }
    }

    public class OrderCodeCreateDto
    {
        public string OrderStartCode { get; set; }
        public string OrderLastCode { get; set; }
    }

    public class OrderCodeUpdateDto
    {
        public string OrderStartCode { get; set; }
        public string OrderLastCode { get; set; }
    }
}
