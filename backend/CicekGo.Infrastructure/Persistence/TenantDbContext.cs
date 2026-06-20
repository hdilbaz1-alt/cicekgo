using CicekGo.Domain.Tenant;
using Microsoft.EntityFrameworkCore;

namespace CicekGo.Infrastructure.Persistence;

/// <summary>Firmaya ait iş verisi DB'si (cicekgo_tenant_*). Bağlantı runtime'da çözülür.</summary>
public class TenantDbContext : DbContext
{
    public TenantDbContext(DbContextOptions<TenantDbContext> options) : base(options) { }

    public DbSet<OrderStatus> OrderStatuses => Set<OrderStatus>();
    public DbSet<ProductType> ProductTypes => Set<ProductType>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<OrderCodeSequence> OrderCodeSequences => Set<OrderCodeSequence>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerBilling> CustomerBillings => Set<CustomerBilling>();
    public DbSet<CustomerGroup> CustomerGroups => Set<CustomerGroup>();
    public DbSet<CustomerGroupMember> CustomerGroupMembers => Set<CustomerGroupMember>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderPayment> OrderPayments => Set<OrderPayment>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<CustomerLedgerEntry> CustomerLedger => Set<CustomerLedgerEntry>();
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();
    public DbSet<PrintTemplate> PrintTemplates => Set<PrintTemplate>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CashMovement> CashMovements => Set<CashMovement>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Refund> Refunds => Set<Refund>();

    private const string Money = "numeric(18,2)";

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<OrderStatus>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.Property(x => x.Color).HasMaxLength(16);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<ProductType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<PaymentMethod>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<OrderCodeSequence>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Prefix).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.Prefix).IsUnique();
        });

        b.Entity<Customer>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(250);
            e.Property(x => x.CardName).HasMaxLength(250);
            e.Property(x => x.CustomerGroup).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.SecondaryPhone).HasMaxLength(50);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.District).HasMaxLength(100);
            e.Property(x => x.CustomerType).HasMaxLength(50);
            e.Property(x => x.Tag).HasMaxLength(50);
            e.Property(x => x.OpeningBalance).HasColumnType(Money);
            e.Property(x => x.CreditLimit).HasColumnType(Money);
            e.HasIndex(x => x.Name);
            e.HasIndex(x => x.Phone);
            e.HasOne(x => x.Billing).WithOne(bz => bz.Customer)
                .HasForeignKey<CustomerBilling>(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CustomerBilling>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CustomerId).IsUnique();
            e.Property(x => x.TaxNumber).HasMaxLength(50);
            e.Property(x => x.TaxOffice).HasMaxLength(150);
            e.Property(x => x.SendMethod).HasMaxLength(50);
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.District).HasMaxLength(100);
        });

        b.Entity<CustomerGroup>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(500);
        });

        b.Entity<CustomerGroupMember>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.GroupId, x.CustomerId }).IsUnique();
            e.HasOne(x => x.Group).WithMany(g => g.Members)
                .HasForeignKey(x => x.GroupId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Customer).WithMany(c => c.GroupMemberships)
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ProductCategory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(150);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<PrintTemplate>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.ElementsJson).HasColumnType("jsonb");
        });

        b.Entity<Refund>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OrderCode).IsRequired().HasMaxLength(80);
            e.Property(x => x.CustomerName).HasMaxLength(200);
            e.Property(x => x.RecipientName).HasMaxLength(200);
            e.Property(x => x.RecipientPhone).HasMaxLength(40);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.Property(x => x.RefundedAmount).HasColumnType(Money);
            e.Property(x => x.Status).IsRequired().HasMaxLength(20);
            e.Property(x => x.Reason).HasMaxLength(300);
            e.Property(x => x.Note).HasMaxLength(300);
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.Status);
            e.HasIndex(x => x.OrderId);
            e.HasIndex(x => x.RecipientPhone);
        });

        b.Entity<Unit>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(30);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<StoreSettings>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.OpenTime).IsRequired().HasMaxLength(5);
            e.Property(x => x.CloseTime).IsRequired().HasMaxLength(5);
        });

        b.Entity<Product>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Unit).HasMaxLength(30);
            e.Property(x => x.SalePrice).HasColumnType(Money);
            e.Property(x => x.PurchasePrice).HasColumnType(Money);
            e.Property(x => x.VatRate).HasColumnType("numeric(5,2)");
            e.Property(x => x.CurrentStock).HasColumnType(Money);
            e.Property(x => x.CriticalStockLevel).HasColumnType(Money);
            e.HasIndex(x => x.Name);
            e.HasOne(x => x.Category).WithMany(c => c.Products)
                .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Order>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Code).IsRequired().HasMaxLength(80);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.SubTotal).HasColumnType(Money);
            e.Property(x => x.DiscountTotal).HasColumnType(Money);
            e.Property(x => x.DeliveryFee).HasColumnType(Money);
            e.Property(x => x.ExtraFee).HasColumnType(Money);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.Property(x => x.RemainingAmount).HasColumnType(Money);
            e.Property(x => x.Status).HasMaxLength(100);
            e.Property(x => x.PaymentStatus).HasMaxLength(50);
            e.Property(x => x.Source).HasMaxLength(50);
            e.Property(x => x.ProductType).HasMaxLength(150);
            e.Property(x => x.DeliveryTimeRange).HasMaxLength(50);
            e.Property(x => x.DeleteReason).HasMaxLength(300);
            e.Property(x => x.RecipientCity).HasMaxLength(100);
            e.Property(x => x.RecipientDistrict).HasMaxLength(100);
            e.Property(x => x.RecipientAddressLine).HasMaxLength(500);
            e.HasIndex(x => x.DeliveryDate);
            e.HasIndex(x => x.IsDeleted);
            e.HasIndex(x => x.AssignedCourierId);
            e.HasQueryFilter(x => !x.IsDeleted);     // soft delete
            e.HasOne(x => x.Customer).WithMany()
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<OrderItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ProductName).IsRequired().HasMaxLength(200);
            e.Property(x => x.Quantity).HasColumnType(Money);
            e.Property(x => x.UnitPrice).HasColumnType(Money);
            e.Property(x => x.Discount).HasColumnType(Money);
            e.Property(x => x.TotalPrice).HasColumnType(Money);
            e.HasIndex(x => x.OrderId);
            e.HasOne(x => x.Order).WithMany(o => o.Items)
                .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Product).WithMany()
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<OrderPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.HasIndex(x => x.OrderId);
            e.HasOne(x => x.Order).WithMany(o => o.Payments)
                .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.PaymentMethod).WithMany()
                .HasForeignKey(x => x.PaymentMethodId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<OrderStatusHistory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).IsRequired().HasMaxLength(100);
            e.HasIndex(x => x.OrderId);
            e.HasOne(x => x.Order).WithMany(o => o.StatusHistory)
                .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<StockMovement>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.MovementType).IsRequired().HasMaxLength(30);
            e.Property(x => x.Quantity).HasColumnType(Money);
            e.Property(x => x.PreviousStock).HasColumnType(Money);
            e.Property(x => x.NewStock).HasColumnType(Money);
            e.HasIndex(x => x.ProductId);
            e.HasOne(x => x.Product).WithMany()
                .HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CustomerLedgerEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.TransactionType).IsRequired().HasMaxLength(30);
            e.Property(x => x.ReferenceType).HasMaxLength(30);
            e.Property(x => x.OrderCode).HasMaxLength(80);
            e.Property(x => x.Debit).HasColumnType(Money);
            e.Property(x => x.Credit).HasColumnType(Money);
            e.Property(x => x.Balance).HasColumnType(Money);
            e.HasIndex(x => x.CustomerId);
            e.HasIndex(x => x.OrderCode);
            e.HasOne(x => x.Customer).WithMany(c => c.LedgerEntries)
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Payment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.Property(x => x.ReceiptNumber).HasMaxLength(50);
            e.HasIndex(x => x.CustomerId);
            e.HasOne(x => x.Customer).WithMany()
                .HasForeignKey(x => x.CustomerId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CashMovement>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.MovementType).IsRequired().HasMaxLength(30);
            e.Property(x => x.Direction).IsRequired().HasMaxLength(5);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.HasIndex(x => x.TransactionDate);
        });

        b.Entity<Expense>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).IsRequired().HasMaxLength(100);
            e.Property(x => x.Amount).HasColumnType(Money);
            e.Property(x => x.PaymentMethod).HasMaxLength(50);
            e.HasIndex(x => x.TransactionDate);
        });

        b.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ActionType).IsRequired().HasMaxLength(50);
            e.Property(x => x.ModuleName).HasMaxLength(50);
            e.Property(x => x.EntityType).HasMaxLength(80);
            e.Property(x => x.EntityId).HasMaxLength(80);
            e.Property(x => x.UserFullName).HasMaxLength(200);
            e.Property(x => x.IpAddress).HasMaxLength(60);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.ActionType);
        });
    }
}
