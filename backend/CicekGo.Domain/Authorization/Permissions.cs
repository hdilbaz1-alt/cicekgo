namespace CicekGo.Domain.Authorization;

/// <summary>
/// İzin kodları kataloğu. Master DB'deki permissions tablosuna seed edilir
/// ve JWT'ye "perms" claim'i olarak eklenir. Modül.aksiyon biçiminde.
/// </summary>
public static class Permissions
{
    // Siparişler
    public const string OrdersView = "orders.view";
    public const string OrdersViewAll = "orders.view_all";
    public const string OrdersViewOwn = "orders.view_own";       // kurye: sadece kendi atanmış
    public const string OrdersCreate = "orders.create";
    public const string OrdersUpdate = "orders.update";
    public const string OrdersDelete = "orders.delete";
    public const string OrdersViewDeleted = "orders.view_deleted";
    public const string OrdersRestore = "orders.restore";
    public const string OrdersAssignCourier = "orders.assign_courier";
    public const string OrdersChangeStatus = "orders.change_status";
    public const string OrdersViewPrice = "orders.view_price";
    public const string OrdersViewPayment = "orders.view_payment";

    // Müşteriler
    public const string CustomersView = "customers.view";
    public const string CustomersCreate = "customers.create";
    public const string CustomersUpdate = "customers.update";
    public const string CustomersDelete = "customers.delete";
    public const string CustomersViewLedger = "customers.view_ledger";

    // Finans / cari / kasa
    public const string FinanceViewGeneralLedger = "finance.view_general_ledger";
    public const string FinanceCreatePayment = "finance.create_payment";
    public const string FinanceManualMovement = "finance.manual_movement";
    public const string FinanceViewCash = "finance.view_cash";

    // Ürün / stok
    public const string ProductsView = "products.view";
    public const string ProductsManage = "products.manage";
    public const string StockView = "stock.view";
    public const string StockManage = "stock.manage";

    // Raporlar
    public const string ReportsViewSales = "reports.view_sales";
    public const string ReportsViewCustomers = "reports.view_customers";
    public const string ReportsViewProducts = "reports.view_products";
    public const string ReportsViewCash = "reports.view_cash";
    public const string ReportsViewCouriers = "reports.view_couriers";
    public const string ReportsExport = "reports.export";

    // Kullanıcı / rol / ayar / audit
    public const string UsersManage = "users.manage";
    public const string RolesManage = "roles.manage";
    public const string SettingsManage = "settings.manage";
    public const string AuditView = "audit.view";

    // Platform / super-admin
    public const string TenantsManage = "tenants.manage";

    /// <summary>Tüm izinler ve açıklamaları (seed için).</summary>
    public static readonly IReadOnlyDictionary<string, string> All = new Dictionary<string, string>
    {
        [OrdersView] = "Siparişleri görüntüleme",
        [OrdersViewAll] = "Tüm siparişleri görüntüleme",
        [OrdersViewOwn] = "Sadece kendine atanmış siparişleri görüntüleme",
        [OrdersCreate] = "Sipariş oluşturma",
        [OrdersUpdate] = "Sipariş güncelleme",
        [OrdersDelete] = "Sipariş silme",
        [OrdersViewDeleted] = "Silinen siparişleri görüntüleme",
        [OrdersRestore] = "Silinen siparişi geri yükleme",
        [OrdersAssignCourier] = "Kurye atama",
        [OrdersChangeStatus] = "Sipariş durumunu değiştirme",
        [OrdersViewPrice] = "Sipariş fiyatını görme",
        [OrdersViewPayment] = "Ödeme bilgisini görme",
        [CustomersView] = "Müşterileri görüntüleme",
        [CustomersCreate] = "Müşteri oluşturma",
        [CustomersUpdate] = "Müşteri güncelleme",
        [CustomersDelete] = "Müşteri silme/pasifleştirme",
        [CustomersViewLedger] = "Müşteri cari hesabını görüntüleme",
        [FinanceViewGeneralLedger] = "Genel cari hesabı görüntüleme",
        [FinanceCreatePayment] = "Tahsilat ekleme",
        [FinanceManualMovement] = "Manuel cari hareket ekleme",
        [FinanceViewCash] = "Kasa raporu görüntüleme",
        [ProductsView] = "Ürünleri görüntüleme",
        [ProductsManage] = "Ürün oluşturma/güncelleme/silme",
        [StockView] = "Stok görüntüleme",
        [StockManage] = "Stok hareketi yönetimi",
        [ReportsViewSales] = "Satış raporu görüntüleme",
        [ReportsViewCustomers] = "Müşteri raporu görüntüleme",
        [ReportsViewProducts] = "Ürün raporu görüntüleme",
        [ReportsViewCash] = "Kasa raporu görüntüleme",
        [ReportsViewCouriers] = "Kurye raporu görüntüleme",
        [ReportsExport] = "Rapor dışa aktarma (Excel/PDF)",
        [UsersManage] = "Firma içi kullanıcı yönetimi",
        [RolesManage] = "Rol ve izin yönetimi",
        [SettingsManage] = "Ayarlar (kod, durum, ürün tipi, ödeme yöntemi)",
        [AuditView] = "Audit log görüntüleme",
        [TenantsManage] = "Platform: firma ve veritabanı yönetimi",
    };

    /// <summary>Firma admininin tüm izinleri (TenantsManage hariç).</summary>
    public static readonly string[] TenantAdmin = All.Keys.Where(k => k != TenantsManage).ToArray();

    /// <summary>Yönetici: finansal kritik ayarlar hariç çoğu şey.</summary>
    public static readonly string[] Manager =
    {
        OrdersView, OrdersViewAll, OrdersCreate, OrdersUpdate, OrdersDelete, OrdersViewDeleted, OrdersRestore,
        OrdersAssignCourier, OrdersChangeStatus, OrdersViewPrice, OrdersViewPayment,
        CustomersView, CustomersCreate, CustomersUpdate, CustomersViewLedger,
        FinanceViewGeneralLedger, FinanceCreatePayment, FinanceViewCash,
        ProductsView, ProductsManage, StockView, StockManage,
        ReportsViewSales, ReportsViewCustomers, ReportsViewProducts, ReportsViewCash, ReportsViewCouriers,
        UsersManage, SettingsManage, AuditView,
    };

    /// <summary>Satış personeli: sipariş + müşteri, sınırlı cari.</summary>
    public static readonly string[] Sales =
    {
        OrdersView, OrdersViewAll, OrdersCreate, OrdersUpdate, OrdersChangeStatus, OrdersViewPrice, OrdersViewPayment,
        CustomersView, CustomersCreate, CustomersUpdate, CustomersViewLedger,
        ProductsView,
    };

    /// <summary>Muhasebe: cari, tahsilat, raporlar.</summary>
    public static readonly string[] Accountant =
    {
        OrdersView, OrdersViewAll, OrdersViewPrice, OrdersViewPayment,
        CustomersView, CustomersViewLedger,
        FinanceViewGeneralLedger, FinanceCreatePayment, FinanceManualMovement, FinanceViewCash,
        ReportsViewSales, ReportsViewCustomers, ReportsViewCash, ReportsExport,
    };

    /// <summary>Kurye: yalnız kendine atanmış siparişler + durum güncelleme.</summary>
    public static readonly string[] Courier =
    {
        OrdersViewOwn, OrdersChangeStatus,
    };

    /// <summary>Depo/stok personeli: ürün ve stok, finans yok.</summary>
    public static readonly string[] Warehouse =
    {
        OrdersView, OrdersViewAll,
        ProductsView, ProductsManage, StockView, StockManage,
        ReportsViewProducts,
    };

    /// <summary>Salt okunur: temel görüntüleme.</summary>
    public static readonly string[] ReadOnly =
    {
        OrdersView, OrdersViewAll, OrdersViewPrice,
        CustomersView, ProductsView, ReportsViewSales,
    };
}

/// <summary>Sistem (her firmada otomatik oluşan) rol adları.</summary>
public static class SystemRoles
{
    public const string PlatformAdmin = "PlatformAdmin"; // tenant_id = null
    public const string TenantAdmin = "Firma Sahibi";
    public const string Manager = "Yönetici";
    public const string Sales = "Satış Personeli";
    public const string Accountant = "Muhasebe";
    public const string Courier = "Kurye";
    public const string Warehouse = "Depo Personeli";
    public const string ReadOnly = "Salt Okunur";
}
