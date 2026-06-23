// İzin kodlarının Türkçe etiketleri + grupları (backend Permissions.All ile eşlenir).
// Rol oluşturma ve "Kullanıcı Bilgileri" ekranında insan-okur etiketler için kullanılır.

export interface PermMeta { code: string; label: string; group: string }

export const PERMISSION_META: PermMeta[] = [
  // Siparişler
  { code: 'orders.view', label: 'Siparişleri görüntüleme', group: 'Siparişler' },
  { code: 'orders.view_all', label: 'Tüm siparişleri görüntüleme', group: 'Siparişler' },
  { code: 'orders.view_own', label: 'Sadece kendine atanmış siparişler', group: 'Siparişler' },
  { code: 'orders.create', label: 'Sipariş oluşturma', group: 'Siparişler' },
  { code: 'orders.update', label: 'Sipariş güncelleme', group: 'Siparişler' },
  { code: 'orders.delete', label: 'Sipariş silme', group: 'Siparişler' },
  { code: 'orders.view_deleted', label: 'Silinen siparişleri görüntüleme', group: 'Siparişler' },
  { code: 'orders.restore', label: 'Silinen siparişi geri yükleme', group: 'Siparişler' },
  { code: 'orders.assign_courier', label: 'Kurye atama', group: 'Siparişler' },
  { code: 'orders.change_status', label: 'Sipariş durumunu değiştirme', group: 'Siparişler' },
  { code: 'orders.view_price', label: 'Sipariş fiyatını görme', group: 'Siparişler' },
  { code: 'orders.view_payment', label: 'Ödeme bilgisini görme', group: 'Siparişler' },
  // Müşteriler
  { code: 'customers.view', label: 'Müşterileri görüntüleme', group: 'Müşteriler' },
  { code: 'customers.create', label: 'Müşteri oluşturma', group: 'Müşteriler' },
  { code: 'customers.update', label: 'Müşteri güncelleme', group: 'Müşteriler' },
  { code: 'customers.delete', label: 'Müşteri silme/pasifleştirme', group: 'Müşteriler' },
  { code: 'customers.view_ledger', label: 'Müşteri cari hesabını görüntüleme', group: 'Müşteriler' },
  // Finans
  { code: 'finance.view_general_ledger', label: 'Genel cari hesabı görüntüleme', group: 'Finans / Kasa' },
  { code: 'finance.create_payment', label: 'Tahsilat ekleme', group: 'Finans / Kasa' },
  { code: 'finance.manual_movement', label: 'Manuel cari hareket ekleme', group: 'Finans / Kasa' },
  { code: 'finance.view_cash', label: 'Kasa raporu görüntüleme', group: 'Finans / Kasa' },
  // Ürün / stok
  { code: 'products.view', label: 'Ürünleri görüntüleme', group: 'Ürün / Stok' },
  { code: 'products.manage', label: 'Ürün oluşturma/güncelleme/silme', group: 'Ürün / Stok' },
  { code: 'stock.view', label: 'Stok görüntüleme', group: 'Ürün / Stok' },
  { code: 'stock.manage', label: 'Stok hareketi yönetimi', group: 'Ürün / Stok' },
  // Raporlar
  { code: 'reports.view_sales', label: 'Satış raporu', group: 'Raporlar' },
  { code: 'reports.view_customers', label: 'Müşteri raporu', group: 'Raporlar' },
  { code: 'reports.view_products', label: 'Ürün raporu', group: 'Raporlar' },
  { code: 'reports.view_cash', label: 'Kasa raporu', group: 'Raporlar' },
  { code: 'reports.view_couriers', label: 'Kurye raporu', group: 'Raporlar' },
  { code: 'reports.export', label: 'Rapor dışa aktarma (Excel/PDF)', group: 'Raporlar' },
  // Yönetim
  { code: 'users.manage', label: 'Firma içi kullanıcı yönetimi', group: 'Yönetim' },
  { code: 'roles.manage', label: 'Rol ve izin yönetimi', group: 'Yönetim' },
  { code: 'settings.manage', label: 'Ayarlar yönetimi', group: 'Yönetim' },
  { code: 'audit.view', label: 'İşlem kayıtlarını görüntüleme', group: 'Yönetim' },
  { code: 'notifications.send', label: 'Toplu bildirim gönderme', group: 'Yönetim' },
  { code: 'tenants.manage', label: 'Platform: firma ve veritabanı yönetimi', group: 'Platform' },
];

const MAP: Record<string, PermMeta> = Object.fromEntries(PERMISSION_META.map((m) => [m.code, m]));

/** İzin kodunu Türkçe etikete çevirir (bilinmiyorsa kodu döndürür). */
export const permLabel = (code: string): string => MAP[code]?.label || code;

/** Rol oluşturma UI'ı için izinleri gruplara ayırır. */
export function groupPermissions(codes?: string[]): { group: string; items: PermMeta[] }[] {
  const source = codes && codes.length ? PERMISSION_META.filter((m) => codes.includes(m.code)) : PERMISSION_META;
  const groups: { group: string; items: PermMeta[] }[] = [];
  for (const m of source) {
    let g = groups.find((x) => x.group === m.group);
    if (!g) { g = { group: m.group, items: [] }; groups.push(g); }
    g.items.push(m);
  }
  return groups;
}
