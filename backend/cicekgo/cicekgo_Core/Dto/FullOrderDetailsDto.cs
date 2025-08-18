using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Dto
{
    public class FullOrderDetailsDto
    {
        public int Id { get; set; }
        public string Order_Id { get; set; }
        public string Order_Status { get; set; }
        public string StatusName { get; set; }
        public string Order_Sender { get; set; }
        public string SenderName { get; set; }
        public string SenderPhone { get; set; }
        public string Order_To { get; set; }
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string RecipientAddress { get; set; }
        public string Order_ProductType { get; set; }
        public string ProductTypeName { get; set; }
        public System.DateTime? Order_DeliveryDate { get; set; }
        public double? Order_Amount { get; set; }
        public double? Order_RemainingAmount { get; set; }
        public System.DateTime CreatedDate { get; set; }
        public System.DateTime? UpdatedDate { get; set; }
        public decimal PaidTotal { get; set; }
        public decimal RemainingTotal { get; set; }
        public System.DateTime? LastPaymentDate { get; set; }
        public string LastPaymentMethod { get; set; }
        public int NoteCount { get; set; }
        public int NotificationCount { get; set; }
        public int IsAnyNotified { get; set; }
    }
}
