import { getApiUrl, getEndpoint } from '../config/api';

const API_BASE_URL = getApiUrl('/api');

export interface OrderListRequest {
  startDate: string;
  endDate: string;
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
  totalPaid: number;
  lastPaymentDate: string | null;
  orderAmount: number;
  orderRemainingAmount: number;
  isNotified: boolean;
  extraNote: string;
  cardNote: string;
  customerNote: string;
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
}

export const orderService = new OrderService();

