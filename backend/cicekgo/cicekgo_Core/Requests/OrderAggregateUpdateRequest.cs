using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Requests
{
    public class OrderAggregateUpdateRequest
    {
        public string Order_Id { get; set; }              // ZORUNLU

        // Orders
        public string Order_Status { get; set; }
        public string Order_Sender { get; set; }
        public string Order_To { get; set; }
        public System.DateTime? Order_DeliveryDate { get; set; }
        public double? Order_Amount { get; set; }
        public double? Order_RemainingAmount { get; set; }
        public string Order_ProductType { get; set; }

        // Sender (opsiyonel; varsa update/ yoksa insert)
        public string SenderName { get; set; }
        public string SenderPhone { get; set; }

        // Recipient (opsiyonel; varsa update/ yoksa insert)
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string RecipientAddress { get; set; }
    }
}
