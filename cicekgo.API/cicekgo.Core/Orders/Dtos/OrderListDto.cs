using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo.Core.Orders.Dtos
{
    public class OrderListDto
    {
        public int OrderPkId { get; set; }
        public string OrderId { get; set; }
        public string OrderStatus { get; set; }
        public string OrderSender { get; set; }
        public string OrderTo { get; set; }
        public DateTime CreatedDate { get; set; }
    }

}
