using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Requests
{
    public class OrderUpdateRequest
    {
        public string Order_Id { get; set; }             // Zorunlu – buna göre bulunacak
        public string Order_Status { get; set; }
        public string Order_Sender { get; set; }
        public string Order_To { get; set; }
        public DateTime? Order_DeliveryDate { get; set; }
        public double? Order_Amount { get; set; }
        public double? Order_RemainingAmount { get; set; }
        public string Order_ProductType { get; set; }
    }
}
