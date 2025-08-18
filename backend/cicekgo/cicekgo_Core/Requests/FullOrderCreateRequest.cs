using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace cicekgo_Core.Requests
{
    public class FullOrderCreateRequest
    {
        // Orders
        public string Order_Id { get; set; }                 // zorunlu & benzersiz
        public string Order_Status { get; set; }             // Beklemede / Onaylandı / Teslimatta / Teslim Edildi
        public string Order_Sender { get; set; }
        public string Order_To { get; set; }
        public DateTime? Order_DeliveryDate { get; set; }
        public double? Order_Amount { get; set; }
        public double? Order_RemainingAmount { get; set; }
        public string Order_ProductType { get; set; }

        // Sender
        public string SenderName { get; set; }
        public string SenderPhone { get; set; }

        // Recipient
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string RecipientAddress { get; set; }

        // Payments
        public List<PaymentDto> Payments { get; set; } = new List<PaymentDto>();

        // Notes
        public string CardNote { get; set; }
        public string CustomerNote { get; set; }
        public string ExtraNote { get; set; }

        // Notification
        public bool? IsNotified { get; set; } = false;
    }

    public class PaymentDto
    {
        public decimal Amount { get; set; }
        public DateTime PaymentDate { get; set; }
        public string MethodName { get; set; }  // Örn: "Kredi Kartı", "Havale/EFT", "Kapıda Ödeme"
    }
}
