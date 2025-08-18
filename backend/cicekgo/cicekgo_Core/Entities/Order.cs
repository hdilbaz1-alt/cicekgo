using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper.Contrib.Extensions;
using Dapper;

namespace cicekgo_Core.Entities
{
    [Table("dbo.Orders")]
    public class Order
    {
        [Key] public int Id { get; set; }
        public string Order_Status { get; set; }
        public string Order_Id { get; set; }
        public string Order_Sender { get; set; }
        public string Order_To { get; set; }
        public DateTime? Order_DeliveryDate { get; set; }
        public double? Order_Amount { get; set; }
        public double? Order_RemainingAmount { get; set; }
        public string Order_ProductType { get; set; }

        [Computed] public DateTime CreatedDate { get; set; } // DB default GETDATE()
        public DateTime? UpdatedDate { get; set; }
    }

    [Table("dbo.OrderSender")]
    public class OrderSender
    {
        [Key] public int Id { get; set; }
        public int OrderId { get; set; }
        public string SenderName { get; set; }
        public string SenderPhone { get; set; }
    }

    [Table("dbo.OrderRecipient")]
    public class OrderRecipient
    {
        [Key] public int Id { get; set; }
        public int OrderId { get; set; }
        public string RecipientName { get; set; }
        public string RecipientPhone { get; set; }
        public string RecipientAddress { get; set; }
    }

    [Table("dbo.OrderPayment")]
    public class OrderPayment
    {
        [Key] public int Id { get; set; }
        public int OrderId { get; set; }
        public decimal PaymentAmount { get; set; }
        public DateTime PaymentDate { get; set; }
        public int PaymentMethodId { get; set; }
    }

    [Table("dbo.PaymentMethod")]
    public class PaymentMethod
    {
        [Key] public int Id { get; set; }
        public string MethodName { get; set; }
    }

    [Table("dbo.OrderNotes")]
    public class OrderNotes
    {
        [Key] public int Id { get; set; }
        public int OrderId { get; set; }
        public string CardNote { get; set; }
        public string CustomerNote { get; set; }
        public string ExtraNote { get; set; }
    }

    [Table("dbo.OrderNotification")]
    public class OrderNotification
    {
        [Key] public int Id { get; set; }
        public int OrderId { get; set; }
        public bool IsNotified { get; set; }
    }
}
