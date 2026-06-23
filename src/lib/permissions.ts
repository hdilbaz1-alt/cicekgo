// İzin yardımcıları — localStorage'daki user.permissions üzerinden çalışır.

export function getUser(): { permissions?: string[]; isPlatformAdmin?: boolean; userName?: string } {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function getPermissions(): string[] {
  const u = getUser();
  return Array.isArray(u.permissions) ? u.permissions : [];
}

export function can(code: string): boolean {
  const u = getUser();
  if (u.isPlatformAdmin) return true;
  return (u.permissions || []).includes(code);
}

export function canAny(...codes: string[]): boolean {
  const u = getUser();
  if (u.isPlatformAdmin) return true;
  const perms = u.permissions || [];
  return codes.some((c) => perms.includes(c));
}

// İzin kodları (backend Permissions.cs ile birebir)
export const P = {
  ordersView: 'orders.view',
  ordersViewAll: 'orders.view_all',
  ordersViewOwn: 'orders.view_own',
  ordersCreate: 'orders.create',
  ordersUpdate: 'orders.update',
  ordersDelete: 'orders.delete',
  ordersViewDeleted: 'orders.view_deleted',
  ordersRestore: 'orders.restore',
  ordersAssignCourier: 'orders.assign_courier',
  ordersChangeStatus: 'orders.change_status',
  customersView: 'customers.view',
  customersCreate: 'customers.create',
  customersUpdate: 'customers.update',
  customersDelete: 'customers.delete',
  customersViewLedger: 'customers.view_ledger',
  financeViewGeneralLedger: 'finance.view_general_ledger',
  financeCreatePayment: 'finance.create_payment',
  financeManualMovement: 'finance.manual_movement',
  financeViewCash: 'finance.view_cash',
  productsView: 'products.view',
  productsManage: 'products.manage',
  stockView: 'stock.view',
  stockManage: 'stock.manage',
  reportsViewSales: 'reports.view_sales',
  reportsViewCustomers: 'reports.view_customers',
  reportsViewProducts: 'reports.view_products',
  reportsViewCash: 'reports.view_cash',
  reportsViewCouriers: 'reports.view_couriers',
  reportsExport: 'reports.export',
  usersManage: 'users.manage',
  rolesManage: 'roles.manage',
  settingsManage: 'settings.manage',
  auditView: 'audit.view',
  notificationsSend: 'notifications.send',
  licenseView: 'license.view',
  emailManage: 'email.manage',
} as const;
