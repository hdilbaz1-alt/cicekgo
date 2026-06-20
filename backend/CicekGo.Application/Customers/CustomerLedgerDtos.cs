namespace CicekGo.Application.Customers;

public class CustomerLedgerDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = default!;
    public string? Description { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public decimal Balance { get; set; }
    public int? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public string? OrderCode { get; set; }
    public string? CustomerNote { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedDate { get; set; }
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
    public decimal TotalDebit { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal Balance { get; set; }
    public DateTime LastTransactionDate { get; set; }
}

/// <summary>Genel ödeme (sipariş bağımsız).</summary>
public class CustomerPaymentDto
{
    public int CustomerId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime? PaymentDate { get; set; }
    public int? PaymentMethodId { get; set; }
}

/// <summary>Sipariş bazlı ödeme.</summary>
public class CustomerOrderPaymentDto
{
    public int CustomerId { get; set; }
    public string OrderCode { get; set; } = default!;
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime? PaymentDate { get; set; }
    public int? PaymentMethodId { get; set; }
}

/// <summary>Müşteri alacağını ödeme (biz müşteriye para iadesi). Cari borç kaydı + kasa çıkışı.</summary>
public class CustomerPayoutDto
{
    public int CustomerId { get; set; }
    public decimal Amount { get; set; }
    public string? Description { get; set; }
    public DateTime? PaymentDate { get; set; }
    public int? PaymentMethodId { get; set; }
}

/// <summary>Manuel cari hareketi (ADJUSTMENT vb.).</summary>
public class CustomerLedgerAddDto
{
    public int CustomerId { get; set; }
    public string TransactionType { get; set; } = "ADJUSTMENT";
    public string? Description { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string? CustomerNote { get; set; }
}
