import { getApiUrl, getEndpoint } from '@/config/api';

export interface CustomerGroupMember {
  id: number;
  groupId: number;
  groupName: string;
  description: string;
  customerId: number;
  customerName: string;
}

export interface CustomerGroupResponse {
  data: {
    total: number;
    items: CustomerGroupMember[];
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface CustomerGroupRequest {
  page: number;
  pageSize: number;
}

export interface CustomerGroup {
  id: number;
  groupName: string;
  description: string;
  createdAt: string;
}

export interface CustomerGroupListResponse {
  data: CustomerGroup[];
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface CustomerGroupAddRequest {
  groupName: string;
  description: string;
}

export interface CustomerGroupMemberAddRequest {
  groupId: number;
  customerId: number;
}

export interface Customer {
  customerId: number;
  customerName: string;
}

export interface CustomerListResponse {
  data: Customer[];
  success: boolean;
  message: string | null;
  statusCode: number;
}

// Yeni Customer interface'i
export interface CustomerDetail {
  customerId: number;
  customerName: string;
  cardName: string;
  customerGroup: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  address?: string;
  city?: string;
  district?: string;
  customerType?: string;
  tag?: string;
  openingBalance?: number;
  creditLimit?: number | null;
  extraNote: string;
  isActive: boolean;
  createdDate: string;
  createdUser: string;
  updatedDate: string;
  updatedUser: string;
  billingId?: number;
  taxNumber?: string;
  taxOffice?: string;
  sendMethod?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  country?: string;
  billingCity?: string;
  billingDistrict?: string;
  billingAddress?: string;
  billingPhone?: string;
  billingEmail?: string;
  website?: string;
}

export interface CustomerSaveRequest {
  customerName: string;
  cardName?: string;
  customerGroup?: string;
  phone?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  district?: string;
  customerType?: string;
  tag?: string;
  openingBalance?: number;
  creditLimit?: number | null;
  extraNote?: string;
  isActive?: boolean;
}

export interface CustomerDetailResponse {
  data: {
    total: number;
    items: CustomerDetail[];
  };
  success: boolean;
  message: string | null;
  statusCode: number;
}

export interface CustomerListRequest {
  search: string;
  page: number;
  pageSize: number;
}

class CustomerService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  async getCustomerGroups(request: CustomerGroupRequest): Promise<CustomerGroupResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    // Backend: POST /api/CustomerGroup/member/list (gövde ile)
    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_GROUPS')), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ search: '', page: request.page, pageSize: request.pageSize })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  async getCustomerList(request: CustomerListRequest): Promise<CustomerDetailResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_LIST')), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  async getCustomerGroupList(): Promise<CustomerGroupListResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_GROUP_LIST')), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  async addCustomerGroup(request: CustomerGroupAddRequest): Promise<CustomerGroupListResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_GROUP_ADD')), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  async addCustomerToGroup(request: CustomerGroupMemberAddRequest): Promise<{ success: boolean; message: string; statusCode: number }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    console.log('Sending request to add customer to group:', request);

    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_GROUP_MEMBER_ADD')), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    const responseText = await response.text();
    console.log('Response from addCustomerToGroup:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });

    if (!response.ok) {
      // JSON parse etmeye çalış
      let errorMessage = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || responseText;
      } catch (e) {
        // JSON parse edilemezse raw text kullan
        errorMessage = responseText;
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
  }

  async getAvailableCustomers(): Promise<CustomerListResponse> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    // Artık Customer/List endpoint'ini kullanıyoruz
    const response = await fetch(getApiUrl(getEndpoint('CUSTOMER_LIST')), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        search: '',
        page: 1,
        pageSize: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // CustomerDetail'den Customer'a dönüştür
    const customers = data.data.items.map((item: CustomerDetail) => ({
      customerId: item.customerId,
      customerName: item.customerName || item.cardName || `${item.firstName} ${item.lastName}`.trim() || 'İsimsiz Müşteri'
    }));

    return {
      data: customers,
      success: true,
      message: null,
      statusCode: 200
    };
  }

  async deleteCustomerGroup(groupId: number): Promise<{ success: boolean; message: string; statusCode: number }> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(getApiUrl(`${getEndpoint('CUSTOMER_GROUP_DELETE')}/${groupId}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return await response.json();
  }

  private jsonHeaders(): HeadersInit {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${this.getToken()}` };
  }

  async getCustomers(search = '', page = 1, pageSize = 500): Promise<{ items: CustomerDetail[]; total: number }> {
    const res = await fetch(getApiUrl(getEndpoint('CUSTOMER_LIST')), {
      method: 'POST', headers: this.jsonHeaders(), body: JSON.stringify({ search, page, pageSize }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return { items: body.data?.items || [], total: body.data?.total ?? 0 };
  }

  async createCustomer(req: CustomerSaveRequest): Promise<number> {
    const res = await fetch(getApiUrl(getEndpoint('CUSTOMERS')), {
      method: 'POST', headers: this.jsonHeaders(), body: JSON.stringify(req),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) throw new Error(body?.message || `HTTP ${res.status}`);
    return body.data as number;
  }

  async updateCustomer(id: number, req: CustomerSaveRequest): Promise<void> {
    const res = await fetch(`${getApiUrl(getEndpoint('CUSTOMERS'))}/${id}`, {
      method: 'PUT', headers: this.jsonHeaders(), body: JSON.stringify(req),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) throw new Error(body?.message || `HTTP ${res.status}`);
  }

  async deleteCustomer(id: number): Promise<void> {
    const res = await fetch(`${getApiUrl(getEndpoint('CUSTOMERS'))}/${id}`, {
      method: 'DELETE', headers: this.jsonHeaders(),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) throw new Error(body?.message || `HTTP ${res.status}`);
  }
}

export const customerService = new CustomerService();
