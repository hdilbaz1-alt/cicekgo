'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';
import OrdersPage from '@/components/OrdersPage';
import CustomersPage from '@/components/CustomersPage';
import CustomerGroupsPage from '@/components/CustomerGroupsPage';
import OrderCodesPage from '@/components/OrderCodesPage';
import CustomerLedgerPage from '@/components/CustomerLedgerPage';
import ProductTypesPage from '@/components/ProductTypesPage';
import OrderStatusPage from '@/components/OrderStatusPage';
import DeletedOrdersPage from '@/components/DeletedOrdersPage';
import UsersPage from '@/components/UsersPage';
import ProductsCatalogPage from '@/components/ProductsCatalogPage';
import UnitsPage from '@/components/UnitsPage';
import StoreHoursPage from '@/components/StoreHoursPage';
import FinancePage from '@/components/FinancePage';
import DashboardPage from '@/components/DashboardPage';
import ReportsPage from '@/components/ReportsPage';
import CourierPanelPage from '@/components/CourierPanelPage';
import AuditLogPage from '@/components/AuditLogPage';
import PrintTemplatesPage from '@/components/PrintTemplatesPage';
import PaymentMethodsPage from '@/components/PaymentMethodsPage';
import AddressSettingsPage from '@/components/AddressSettingsPage';
import NonCariPage from '@/components/NonCariPage';
import NotificationsPage from '@/components/NotificationsPage';
import AccountPage from '@/components/AccountPage';
import EmailNotificationsPage from '@/components/EmailNotificationsPage';
import MorePage from '@/components/MorePage';
import CommandPalette from '@/components/CommandPalette';
import { Search } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import SuperAdminPanel from '@/components/SuperAdminPanel';

import { authService } from '@/services/authService';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Anasayfa', orders: 'Siparişler', 'my-deliveries': 'Teslimatlarım',
  customers: 'Müşteriler', 'customer-groups': 'Müşteri Grupları', 'customer-ledger': 'Cari Hesaplar', 'non-cari': 'Cari Olmayanlar',
  finance: 'Kasa & Cari', reports: 'Raporlar', 'products-catalog': 'Ürünler', users: 'Kullanıcılar',
  'deleted-orders': 'Silinen Siparişler', 'audit-log': 'İşlem Kayıtları', 'order-codes': 'Sipariş Kodları',
  units: 'Birim Ayarları', 'store-hours': 'Çalışma Saatleri', 'order-status': 'Sipariş Durumları',
  'print-templates': 'Yazdırma Şablonları', 'payment-methods': 'Ödeme Yöntemleri',
  'address-settings': 'Varsayılan Adres', notifications: 'Bildirimler', account: 'Hesap Ayarları',
  'email-notifications': 'E-posta Bildirimleri',
};

export default function HomePage() {
  const [user, setUser] = useState<{ name?: string; email?: string; userName?: string; roles?: { id: number; name: string }[] } | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [navOpts, setNavOpts] = useState<Record<string, unknown>>({});
  const router = useRouter();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmdOpen((v) => !v); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsPlatformAdmin(!!parsedUser.isPlatformAdmin);
      } catch (error) {
        router.push('/login');
      }
    }
  }, [router]);

  // Push bildiriminden derin bağlantı: /?go=order&code=XXX → siparişi aç
  useEffect(() => {
    if (!user) return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('go') === 'order' && sp.get('code')) {
      setCurrentPage('orders');
      setNavOpts({ openOrderCode: sp.get('code')! });
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [user]);

  const handleLogout = () => {
    authService.clearToken();
    router.push('/login');
  };

  // Platform süper-admin → firma yönetimi paneli
  if (isPlatformAdmin) {
    return <SuperAdminPanel onLogout={handleLogout} />;
  }

  const handlePageChange = (page: string, opts?: Record<string, unknown>) => {
    setCurrentPage(page);
    setNavOpts(opts || {});
  };

  const handleSidebarToggle = () => setSidebarCollapsed((v) => !v);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handlePageChange} />;
      case 'orders':
        return (
          <OrdersPage
            onCreateOrder={() => setIsCreateModalOpen(true)}
            isCreateModalOpen={isCreateModalOpen}
            onCloseModal={() => setIsCreateModalOpen(false)}
            focus={navOpts.focus as string | undefined}
            openOrderCode={navOpts.openOrderCode as string | undefined}
            onNavigate={handlePageChange}
          />
        );
      case 'customers':
        return <CustomersPage />;
      case 'customer-groups':
        return <CustomerGroupsPage />;
      case 'order-codes':
        return <OrderCodesPage />;
      case 'product-types':
        return <ProductTypesPage />;
      case 'order-status':
        return <OrderStatusPage />;
      case 'print-templates':
        return <PrintTemplatesPage />;
      case 'customer-ledger':
        return <CustomerLedgerPage initialFilter={navOpts.focus as 'all' | 'debit' | 'credit' | undefined} initialCustomerId={navOpts.customerId as number | undefined} />;
      case 'non-cari':
        return <NonCariPage />;
      case 'finance':
        return <FinancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'my-deliveries':
        return <CourierPanelPage />;
      case 'audit-log':
        return <AuditLogPage />;
      case 'deleted-orders':
        return <DeletedOrdersPage />;
      case 'users':
        return <UsersPage />;
      case 'products-catalog':
        return <ProductsCatalogPage />;
      case 'units':
        return <UnitsPage />;
      case 'store-hours':
        return <StoreHoursPage />;
      case 'payment-methods':
        return <PaymentMethodsPage />;
      case 'address-settings':
        return <AddressSettingsPage />;
      case 'notifications':
        return <NotificationsPage onNavigate={handlePageChange} />;
      case 'account':
        return <AccountPage onNavigate={handlePageChange} />;
      case 'email-notifications':
        return <EmailNotificationsPage />;
      case 'more':
        return <MorePage onNavigate={handlePageChange} onLogout={handleLogout} />;
      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Sayfa Bulunamadı</h1>
              <p className="text-gray-600">
                Aradığınız sayfa bulunamadı.
              </p>
            </div>
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Masaüstü: sidebar (sol menü) */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          onCreateOrder={() => { handlePageChange('orders'); setIsCreateModalOpen(true); }}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0">
        {/* Masaüstü başlık */}
        <div className="hidden lg:block">
          <Header
            onMenuClick={() => {}}
            onSearchClick={() => setCmdOpen(true)}
            onNavigate={handlePageChange}
            title={PAGE_TITLES[currentPage]}
          />
        </div>

        {/* Mobil: üst app-bar (mobile-first) */}
        <header className="lg:hidden shrink-0 bg-white/95 backdrop-blur border-b border-slate-100 h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/cicekgologo.png" alt="ÇiçekGo" className="h-7 w-auto object-contain" />
            <span className="font-semibold text-slate-800 truncate">{PAGE_TITLES[currentPage] || ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setCmdOpen(true)} title="Ara" className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><Search className="w-5 h-5" /></button>
            <NotificationBell onNavigate={handlePageChange} />
          </div>
        </header>

        {/* İçerik */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <div key={currentPage} className="animate-in h-full">
            {renderCurrentPage()}
          </div>
        </main>
      </div>

      {/* Mobil alt navigasyon */}
      <BottomNavigation
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={handlePageChange}
        onNewOrder={() => { handlePageChange('orders'); setIsCreateModalOpen(true); }}
      />
    </div>
  );
}
