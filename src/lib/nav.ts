import {
  LayoutDashboard, ClipboardList, Truck, Users, UsersRound, BookText, Wallet,
  BarChart3, Package, UserCog, Trash2, ScrollText, Tag, Ruler, Clock, ListChecks,
  Printer, RotateCcw, MapPin, Bell, Mail, type LucideIcon,
} from 'lucide-react';
import { P } from './permissions';

export interface NavItem { id: string; label: string; icon: LucideIcon; perm?: string[] }
export interface NavGroup { group: string; items: NavItem[] }

/** Mobil "Menü" sayfası için tüm gezinti (sidebar ITEMS ile aynı kapsam). */
export const NAV_GROUPS: NavGroup[] = [
  { group: 'Genel', items: [
    { id: 'dashboard', label: 'Anasayfa', icon: LayoutDashboard },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
  ]},
  { group: 'Operasyon', items: [
    { id: 'orders', label: 'Siparişler', icon: ClipboardList, perm: [P.ordersView] },
    { id: 'my-deliveries', label: 'Teslimatlarım', icon: Truck, perm: [P.ordersViewOwn] },
    { id: 'customers', label: 'Müşteriler', icon: Users, perm: [P.customersView] },
    { id: 'customer-groups', label: 'Müşteri Grupları', icon: UsersRound, perm: [P.customersView] },
  ]},
  { group: 'Para', items: [
    { id: 'customer-ledger', label: 'Cari Hesaplar', icon: BookText, perm: [P.customersViewLedger, P.financeViewGeneralLedger] },
    { id: 'non-cari', label: 'Cari Olmayanlar', icon: RotateCcw, perm: [P.financeViewGeneralLedger] },
    { id: 'finance', label: 'Kasa & Cari', icon: Wallet, perm: [P.financeViewGeneralLedger, P.financeViewCash] },
    { id: 'reports', label: 'Raporlar', icon: BarChart3, perm: [P.reportsViewSales, P.reportsViewProducts, P.reportsViewCustomers, P.reportsViewCash, P.reportsViewCouriers] },
  ]},
  { group: 'Katalog', items: [
    { id: 'products-catalog', label: 'Ürünler', icon: Package, perm: [P.productsView] },
  ]},
  { group: 'Yönetim', items: [
    { id: 'users', label: 'Kullanıcılar', icon: UserCog, perm: [P.usersManage] },
    { id: 'deleted-orders', label: 'Silinen Siparişler', icon: Trash2, perm: [P.ordersViewDeleted] },
    { id: 'audit-log', label: 'İşlem Kayıtları', icon: ScrollText, perm: [P.auditView] },
    { id: 'email-notifications', label: 'E-posta Bildirimleri', icon: Mail, perm: [P.emailManage] },
  ]},
  { group: 'Ayarlar', items: [
    { id: 'order-codes', label: 'Sipariş Kodları', icon: Tag, perm: [P.settingsManage] },
    { id: 'units', label: 'Birim Ayarları', icon: Ruler, perm: [P.settingsManage] },
    { id: 'store-hours', label: 'Çalışma Saatleri', icon: Clock, perm: [P.settingsManage] },
    { id: 'order-status', label: 'Sipariş Durumları', icon: ListChecks, perm: [P.settingsManage] },
    { id: 'print-templates', label: 'Yazdırma Şablonları', icon: Printer, perm: [P.settingsManage] },
    { id: 'payment-methods', label: 'Ödeme Yöntemleri', icon: Wallet, perm: [P.settingsManage] },
    { id: 'address-settings', label: 'Varsayılan Adres', icon: MapPin },
  ]},
];
