namespace cicekgo.Core.Customers.Dtos
{
    public class CustomerLedgerDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public DateTime TransactionDate { get; set; }
        public string TransactionType { get; set; } = default!; // 'ORDER', 'PAYMENT', 'ADJUSTMENT'
        public string? Description { get; set; }
        public decimal Debit { get; set; } // Borç (sipariş tutarı)
        public decimal Credit { get; set; } // Alacak (ödeme tutarı)
        public decimal Balance { get; set; } // Kalan bakiye
        public int? ReferenceId { get; set; } // OrderId veya PaymentId
        public string? ReferenceType { get; set; } // 'ORDER', 'PAYMENT'
        public string? OrderCode { get; set; } // Sipariş kodu
        public string? CustomerNote { get; set; } // Müşteri notu
        public string? CreatedBy { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class CustomerLedgerAddDto
    {
        public int CustomerId { get; set; }
        public string TransactionType { get; set; } = default!;
        public string? Description { get; set; }
        public decimal Debit { get; set; } = 0;
        public decimal Credit { get; set; } = 0;
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string? OrderCode { get; set; } // Sipariş kodu
        public string? CustomerNote { get; set; } // Müşteri notu
    }

    public class CustomerLedgerListRequestDto
    {
        public int CustomerId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? TransactionType { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
    }

    public class CustomerBalanceDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = default!;
        public decimal TotalDebit { get; set; } // Toplam borç
        public decimal TotalCredit { get; set; } // Toplam alacak
        public decimal Balance { get; set; } // Kalan bakiye (Credit - Debit)
        public DateTime LastTransactionDate { get; set; }
    }

    public class CustomerPaymentDto
    {
        public int CustomerId { get; set; }
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public DateTime PaymentDate { get; set; } = DateTime.Now;
    }

    public class CustomerLedgerUpdateDto
    {
        public decimal Debit { get; set; } = 0;
        public decimal Credit { get; set; } = 0;
        public string? Description { get; set; }
        public string? CustomerNote { get; set; } // Müşteri notu (alıcı bilgileri)
    }
}
