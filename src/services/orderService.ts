import { getApiUrl, getEndpoint } from '@/config/api';

const API_BASE_URL = getApiUrl('/api');

export interface OrderListRequest {
  startDate?: string;
  endDate?: string;
  customerId?: number;
  page: number;
  pageSize: number;
}

export interface OrderItem {
  orderPkId: number;
  orderCode: string;
  orderStatus: string;
  productType: string;
  createdDate: string;
  deliveryDate: string;
  createdUser: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity?: string | null;
  recipientDistrict?: string | null;
  recipientAddressLine?: string | null;
  totalPaid: number;
  lastPaymentDate: string | null;
  orderAmount: number;
  orderRemainingAmount: number;
  isNotified: boolean;
  extraNote: string;
  cardNote: string;
  customerNote: string;
  customerId?: number | null;
  // Faz 2
  subTotal?: number;
  discountTotal?: number;
  deliveryFee?: number;
  extraFee?: number;
  source?: string | null;
  paymentStatus?: string | null;
  deliveryTimeRange?: string | null;
  deliveryNote?: string | null;
  assignedCourierId?: number | null;
  assignedCourierName?: string | null;
  items?: OrderItemLine[];
}

export interface OrderMovement {
  id: number; date: string; movementType: string; direction: string; amount: number; paymentMethod?: string | null; description?: string | null;
}
export interface OrderLedger {
  orderCode: string; customerId?: number | null; recipientName?: string | null; recipientPhone?: string | null;
  senderName?: string | null; senderPhone?: string | null; status?: string | null;
  amount: number; paid: number; remaining: number; movements: OrderMovement[];
}

export interface OrderItemLine {
  id?: number;
  productId?: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice?: number;
}

export interface OrderListResponse {
  data: {
    totalCount: number;
    page: number;
    pageSize: number;
    items: OrderItem[];
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface CreateOrderRequest {
  orderId: string;
  orderStatus: string;
  orderSender: string;
  orderTo: string;
  orderDeliveryDate: string;
  orderAmount: number;
  orderRemainingAmount: number;
  orderProductType: string;
  customerId?: number; // Cari hesap için müşteri ID
  extraNote: string;
  cardNote: string;
  customerNote: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  isNotified: boolean;
  payments: Array<{
    paymentAmount: number;
    paymentMethodId: number;
    paymentDate: string;
  }>;
  // Faz 2 (opsiyonel)
  items?: OrderItemLine[];
  discountTotal?: number;
  deliveryFee?: number;
  extraFee?: number;
  source?: string;
  paymentStatus?: string;
  deliveryTimeRange?: string;
  deliveryNote?: string;
  assignedCourierId?: number | null;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface UpdateOrderRequest {
  orderPkId: number;
  orderStatus: string;
  orderSender: string;
  orderTo: string;
  orderDeliveryDate: string;
  orderAmount: number;
  orderRemainingAmount: number;
  orderProductType: string;
  extraNote: string;
  cardNote: string;
  customerNote: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  isNotified: boolean;
  replacePayments: boolean;
  payments: Array<{
    paymentAmount: number;
    paymentMethodId: number;
    paymentDate: string;
  }>;
}

export interface UpdateOrderResponse {
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface OrderCode {
  id: number;
  orderStartCode: string;
  orderLastCode: string;
}

export interface OrderCodeResponse {
  data: OrderCode[];
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface OrderCodeUpdateRequest {
  orderStartCode: string;
  orderLastCode: string;
}

export interface OrderCodeAddRequest {
  orderStartCode: string;
  orderLastCode: string;
}

// Customer interfaces
export interface Customer {
  customerId: number;
  customerName: string;
  cardName: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdDate: string;
  createdUser: string;
  updatedDate: string;
  updatedUser: string;
  billingId: number;
  taxNumber: string;
  taxOffice: string;
  sendMethod: string;
  firstName: string;
  lastName: string;
  title: string;
  country: string;
  city: string;
  district: string;
  address: string;
  billingPhone: string;
  billingEmail: string;
  website: string;
  billingCreatedDate: string;
  billingCreatedUser: string;
  billingUpdatedDate: string;
  billingUpdatedUser: string;
}

export interface CustomerListRequest {
  search: string;
  page: number;
  pageSize: number;
}

export interface CustomerListResponse {
  data: {
    total: number;
    items: Customer[];
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

class OrderService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  async getOrders(request: OrderListRequest): Promise<OrderListResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(`${API_BASE_URL}/Orders/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async getLedger(orderCode: string): Promise<OrderLedger> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/ledger`, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const b = await res.json();
    return b.data as OrderLedger;
  }

  async payOrder(orderCode: string, body: { amount: number; paymentMethodId?: number; paymentDate?: string; description?: string }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/pay`, { method: 'POST', headers: this.authHeaders(), body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok || b.success === false) throw new Error(b.message || 'Tahsilat eklenemedi');
  }

  async refundOrder(orderCode: string, body: { amount: number; paymentMethodId?: number; refundDate?: string; note?: string }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/refund`, { method: 'POST', headers: this.authHeaders(), body: JSON.stringify(body) });
    const b = await res.json().catch(() => ({}));
    if (!res.ok || b.success === false) throw new Error(b.message || 'İade eklenemedi');
  }

  async search(q: string, nonCariOnly = false): Promise<OrderItem[]> {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (nonCariOnly) p.set('nonCariOnly', 'true');
    const res = await fetch(`${API_BASE_URL}/Orders/search?${p}`, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const b = await res.json();
    return b.success ? (b.data as OrderItem[]) : [];
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(`${API_BASE_URL}/Orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  async updateOrder(orderCode: string, request: UpdateOrderRequest): Promise<UpdateOrderResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(`${API_BASE_URL}/Orders/${orderCode}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  private authHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
    };
  }

  async deleteOrder(orderCode: string, opts?: { reason?: string; feeRefunded?: boolean; refundPlannedDate?: string | null; refundPaymentMethodId?: number | null }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}`, {
      method: 'DELETE', headers: this.authHeaders(),
      body: JSON.stringify({
        reason: opts?.reason || null,
        feeRefunded: opts?.feeRefunded ?? false,
        refundPlannedDate: opts?.refundPlannedDate || null,
        refundPaymentMethodId: opts?.refundPaymentMethodId || null,
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  }

  async restoreOrder(orderCode: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/restore`, {
      method: 'POST', headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  }

  async getDeletedOrders(): Promise<DeletedOrderItem[]> {
    const res = await fetch(`${API_BASE_URL}/Orders/deleted`, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const body = await res.json();
    return body.data as DeletedOrderItem[];
  }

  async changeStatus(orderCode: string, status: string, note?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/change-status`, {
      method: 'POST', headers: this.authHeaders(), body: JSON.stringify({ status, note: note || null }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  }

  async assignCourier(orderCode: string, courierUserId: number | null): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}/assign-courier`, {
      method: 'POST', headers: this.authHeaders(), body: JSON.stringify({ courierUserId }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  }

  async getMyAssigned(request: OrderListRequest): Promise<OrderListResponse> {
    const res = await fetch(`${API_BASE_URL}/Orders/my-assigned`, {
      method: 'POST', headers: this.authHeaders(), body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  }

  async getOrderDetail(orderCode: string): Promise<OrderItem> {
    const res = await fetch(`${API_BASE_URL}/Orders/${encodeURIComponent(orderCode)}`, { headers: this.authHeaders() });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const body = await res.json();
    return body.data as OrderItem;
  }
}

export interface DeletedOrderItem {
  orderPkId: number;
  orderCode: string;
  recipientName?: string | null;
  senderName?: string | null;
  orderAmount: number;
  paymentStatus?: string | null;
  deletedAt?: string | null;
  deletedByUserName?: string | null;
  deleteReason?: string | null;
}

export const orderService = new OrderService();

// Sipariş kodları servisleri
export const getOrderCodes = async (): Promise<OrderCodeResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(getApiUrl(getEndpoint('ORDER_CODE_LIST')), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const addOrderCode = async (data: OrderCodeAddRequest): Promise<OrderCodeResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(getApiUrl(getEndpoint('ORDER_CODE_ADD')), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const updateOrderCode = async (id: number, data: OrderCodeUpdateRequest): Promise<OrderCodeResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(getApiUrl(`${getEndpoint('ORDER_CODE_UPDATE')}/${id}`), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export const deleteOrderCode = async (id: number): Promise<OrderCodeResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(getApiUrl(`${getEndpoint('ORDER_CODE_DELETE')}/${id}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Müşteri listesi getir
export const getCustomerList = async (request: CustomerListRequest): Promise<CustomerListResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Token bulunamadı');
  }

  const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_LIST')), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

