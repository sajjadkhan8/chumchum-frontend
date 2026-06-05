import { apiClient } from '@/lib/api/client';
import { mapUser } from '@/lib/api/mappers';
import type { OrderStatus, User } from '@/types';

export interface AdminDashboard {
  users: {
    total: number;
    creators: number;
    brands: number;
    admins: number;
    active: number;
    inactive: number;
  };
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    completedOrderAmount: number;
  };
}

export interface AdminUser extends User {
  active: boolean;
  creator?: { id?: string; isVerified?: boolean; is_verified?: boolean };
  brand?: { id?: string; businessVerificationStatus?: string; business_verification_status?: string };
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: 'all' | 'creator' | 'brand' | 'platform_admin';
  active?: 'all' | 'active' | 'inactive';
  page?: number;
  limit?: number;
}

interface BackendAdminUser {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
  name?: string;
  avatarUrl?: string;
  active?: boolean;
  createdAt?: string;
  creator?: { id?: string; isVerified?: boolean; is_verified?: boolean };
  brand?: { id?: string; businessVerificationStatus?: string; business_verification_status?: string };
}

export interface AdminOrder {
  id: string;
  orderNumber?: string;
  packageId: string;
  packageTitle: string;
  creatorId: string;
  creatorName: string;
  brandId: string;
  brandName: string;
  dealType: string;
  amount?: number;
  status: OrderStatus;
  progress: number;
  createdAt?: string;
  deadlineDate?: string;
  deliveryDate?: string;
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminOrderFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AmbassadorApplication {
  id: string;
  creatorId: string;
  status: string;
  submittedAt?: string;
  identityVerified: boolean;
  engagementVerified: boolean;
  contentReviewPassed: boolean;
  backgroundCheckPassed: boolean;
  notes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface AmbassadorApplicationsResponse {
  applications: AmbassadorApplication[];
  total: number;
  page: number;
  limit: number;
}

const normalizeOrderStatus = (value?: string): OrderStatus => {
  const lowered = (value || '').toLowerCase();
  if (
    lowered === 'accepted' ||
    lowered === 'in_progress' ||
    lowered === 'delivered' ||
    lowered === 'review' ||
    lowered === 'revision' ||
    lowered === 'completed' ||
    lowered === 'cancelled'
  ) {
    return lowered;
  }
  return 'pending';
};

const mapAdminUser = (input: BackendAdminUser): AdminUser => ({
  ...mapUser(input),
  active: input.active !== false,
  creator: input.creator,
  brand: input.brand,
});

const mapAdminOrder = (input: Partial<AdminOrder>): AdminOrder => ({
  id: input.id || '',
  orderNumber: input.orderNumber,
  packageId: input.packageId || '',
  packageTitle: input.packageTitle || 'Package',
  creatorId: input.creatorId || '',
  creatorName: input.creatorName || 'Creator',
  brandId: input.brandId || '',
  brandName: input.brandName || 'Brand',
  dealType: input.dealType || 'paid',
  amount: input.amount,
  status: normalizeOrderStatus(input.status),
  progress: input.progress || 0,
  createdAt: input.createdAt,
  deadlineDate: input.deadlineDate,
  deliveryDate: input.deliveryDate,
});

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    return apiClient.get<AdminDashboard>('/api/v1/admin/dashboard');
  },

  async getUsers(filters: AdminUserFilters = {}): Promise<AdminUsersResponse> {
    const response = await apiClient.get<{ users: BackendAdminUser[]; total: number; page: number; limit: number }>(
      '/api/v1/admin/users',
      {
        query: {
          search: filters.search,
          role: filters.role && filters.role !== 'all' ? filters.role : undefined,
          active: filters.active === 'active' ? true : filters.active === 'inactive' ? false : undefined,
          page: filters.page ?? 0,
          limit: filters.limit ?? 20,
        },
      },
    );

    return {
      ...response,
      users: response.users.map(mapAdminUser),
    };
  },

  async updateUserStatus(id: string, active: boolean): Promise<AdminUser> {
    const response = await apiClient.patch<BackendAdminUser>(`/api/v1/admin/users/${id}/status`, { active });
    return mapAdminUser(response);
  },

  async getOrders(filters: AdminOrderFilters = {}): Promise<AdminOrdersResponse> {
    const response = await apiClient.get<{ orders: Partial<AdminOrder>[]; total: number; page: number; limit: number }>('/api/v1/admin/orders', {
      query: {
        search: filters.search,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
    return {
      total: response.total,
      page: response.page,
      limit: response.limit,
      orders: response.orders.map(mapAdminOrder),
    };
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<AdminOrder> {
    const response = await apiClient.patch<Partial<AdminOrder>>(`/api/v1/admin/orders/${id}/status`, {
      status: status.toUpperCase(),
    });
    return mapAdminOrder(response);
  },

  async updateCreatorVerification(id: string, verified: boolean) {
    return apiClient.patch(`/api/v1/admin/creators/${id}/verification`, { verified });
  },

  async updateBrandVerification(id: string, status: string, contactEmail?: string, phoneNumber?: string) {
    return apiClient.patch(`/api/v1/admin/brands/${id}/verification`, {
      status,
      contactEmail,
      phoneNumber,
    });
  },

  async getAmbassadorApplications(status?: string, page = 0, limit = 50): Promise<AmbassadorApplicationsResponse> {
    return apiClient.get<AmbassadorApplicationsResponse>('/api/v1/admin/ambassador/applications', {
      query: { status, page, limit },
    });
  },

  async reviewAmbassadorApplication(id: string, status: string, notes?: string): Promise<AmbassadorApplication> {
    return apiClient.patch<AmbassadorApplication>(`/api/v1/admin/ambassador/applications/${id}`, { status, notes });
  },
};
