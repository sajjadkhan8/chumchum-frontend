import { apiClient } from '@/lib/api/client';
import { mapUser } from '@/lib/api/mappers';
import type { OrderStatus, User } from '@/types';
import type { CreatorBadgeLevel } from '@/types';

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
    gmv?: number;
  };
  ordersByCategory?: { category: string; count: number }[];
}

export interface AdminBrandMetrics {
  brandId: string;
  totalOrders: number;
  completedOrders: number;
  completionRate: number;
  avgRating: number;
  repeatCreatorRate: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

export interface AdminCreatorScoreDetails {
  creatorId: string;
  score: {
    total: number;
    deliveryScore: number;
    ratingScore: number;
    accountAgeScore: number;
    cancellationScore: number;
    profileCompletenessScore: number;
    consistencyScore: number;
  };
  tier: string;
  percentileRank: number;
  strengths: string[];
  improvements: string[];
  nextTierPoints?: number;
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

export interface AdminVerificationCreator {
  id: string;
  name: string;
  username?: string;
  email?: string;
  is_verified: boolean;
  badge_level: CreatorBadgeLevel;
}

export interface AdminVerificationBrand {
  id: string;
  name: string;
  business_verification_status?: string;
  verification_contact_email?: string;
  verification_phone_number?: string;
  user?: {
    email?: string;
  };
}

export interface AdminVerificationDocument {
  id: string;
  type: 'tax_id' | 'business_registration' | 'bank_details' | string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface AdminVerificationEvent {
  id: string;
  eventType: string;
  details?: string;
  documentId?: string;
  createdAt: string;
  actor?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface AdminBrandVerificationEvidence {
  brand: AdminVerificationBrand;
  documents: AdminVerificationDocument[];
  events: AdminVerificationEvent[];
  requiredDocumentTypes: string[];
  canApprove: boolean;
}

export interface AdminVerificationFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminCreatorQueueResponse {
  creators: AdminVerificationCreator[];
  total: number;
  page: number;
  limit: number;
}

interface BackendAdminVerificationCreator extends Omit<AdminVerificationCreator, 'badge_level'> {
  badge_level?: string;
}

export interface AdminBrandQueueResponse {
  brands: AdminVerificationBrand[];
  total: number;
  page: number;
  limit: number;
}

export interface AmbassadorApplication {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorEmail?: string;
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

export type DisputeStatus = 'open' | 'under_review' | 'waiting_for_parties' | 'resolved' | 'closed';
export type DisputeResolution = 'none' | 'creator_favored' | 'brand_favored' | 'mutual_agreement' | 'cancel_order' | 'no_action';

export interface AdminDispute {
  id: string;
  orderId: string;
  orderNumber?: string;
  packageTitle: string;
  creatorName: string;
  brandName: string;
  orderAmount?: number;
  orderStatus: OrderStatus;
  dealType: string;
  title: string;
  description: string;
  status: DisputeStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedAdminId?: string;
  assignedAdminName?: string;
  resolution: DisputeResolution;
  resolutionNotes?: string;
  resolvedAt?: string;
  refundExecuted: boolean;
  refundStatus?: 'pending' | 'completed' | 'failed';
  refundProvider?: string;
  providerRefundId?: string;
  refundFailureReason?: string;
  refundAmount?: number;
  creatorClawbackAmount?: number;
  refundReason?: string;
  refundExecutedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminDisputesResponse {
  disputes: AdminDispute[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface AdminAuditLogsResponse {
  logs: AdminAuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPaymentsStats {
  totalTransactions: number;
  pendingTransactions: number;
  totalEarnings: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  completedWithdrawals: number;
  completedWithdrawalsAmount: number;
}

export type TransactionType = 'order_payment' | 'earning' | 'affiliate_commission' | 'withdrawal' | 'refund' | 'platform_fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AdminTransaction {
  id: string;
  creatorId: string;
  creatorName: string;
  orderId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: TransactionStatus;
  createdAt: string;
}

export interface AdminTransactionFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminWithdrawal {
  id: string;
  creatorId: string;
  creatorName: string;
  payoutMethodId: string;
  payoutMethodName: string;
  payoutMethodType: string;
  amount: number;
  status: WithdrawalStatus;
  processedAt?: string;
  createdAt: string;
}

export interface AdminWithdrawalFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminWithdrawalsResponse {
  withdrawals: AdminWithdrawal[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPaymentAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  brandId?: string;
  brandName?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  createdAt: string;
}

export interface AdminPaymentAuditLogsResponse {
  logs: AdminPaymentAuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminSLAMetrics {
  avgDisputeResolutionDays: number;
  withdrawalsProcessedWithin24hPct: number;
  ordersCompletedOnTimePct: number;
  pendingCreatorVerifications: number;
  pendingBrandVerifications: number;
}

export interface AdminApiLog {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  service: string;
  errorMessage?: string;
}

export interface AdminApiLogsResponse {
  logs: AdminApiLog[];
  total: number;
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

const normalizeCreatorBadgeLevel = (value?: string): CreatorBadgeLevel => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'verified' || lowered === 'rising_star' || lowered === 'pro' || lowered === 'elite') {
    return lowered;
  }
  return 'none';
};

const mapAdminVerificationCreator = (input: BackendAdminVerificationCreator): AdminVerificationCreator => ({
  ...input,
  badge_level: normalizeCreatorBadgeLevel(input.badge_level),
});

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

  async moderateUser(id: string, action: 'suspend' | 'ban' | 'unban', reason?: string, suspendDays?: number, stepUpToken?: string): Promise<AdminUser> {
    const response = await apiClient.patch<BackendAdminUser>(`/api/v1/admin/users/${id}/moderate`, {
      action,
      reason,
      suspendDays,
    }, {
      headers: stepUpToken ? { 'X-Step-Up-Token': stepUpToken } : undefined,
    });
    return mapAdminUser(response);
  },

  async bulkModerateUsers(
    userIds: string[],
    action: 'enable' | 'disable' | 'suspend' | 'ban',
    reason?: string,
    suspendDays?: number,
    stepUpToken?: string,
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const response = await apiClient.post<{ succeeded?: string[]; failed?: string[] }>(
      '/api/v1/admin/users/bulk-moderate',
      {
        userIds,
        action,
        reason: reason || undefined,
        suspendDays: action === 'suspend' ? (suspendDays ?? 30) : undefined,
      },
      { headers: stepUpToken ? { 'X-Step-Up-Token': stepUpToken } : undefined },
    );
    return {
      succeeded: response.succeeded ?? userIds,
      failed: response.failed ?? [],
    };
  },

  async getBrandMetrics(brandId: string): Promise<AdminBrandMetrics | null> {
    return apiClient.get<AdminBrandMetrics>(`/api/v1/admin/brands/${brandId}/metrics`);
  },

  async getCreatorScoreDetails(creatorId: string): Promise<AdminCreatorScoreDetails | null> {
    return apiClient.get<AdminCreatorScoreDetails>(`/api/v1/admin/creators/${creatorId}/ambassador-score`);
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

  async updateCreatorVerification(id: string, verified: boolean): Promise<AdminVerificationCreator> {
    const response = await apiClient.patch<BackendAdminVerificationCreator>(`/api/v1/admin/creators/${id}/verification`, { verified });
    return mapAdminVerificationCreator(response);
  },

  async updateCreatorBadge(id: string, badgeLevel: CreatorBadgeLevel): Promise<AdminVerificationCreator> {
    const response = await apiClient.patch<BackendAdminVerificationCreator>(`/api/v1/admin/creators/${id}/badge`, { badgeLevel });
    return mapAdminVerificationCreator(response);
  },

  async getVerificationCreators(filters: AdminVerificationFilters = {}): Promise<AdminCreatorQueueResponse> {
    const response = await apiClient.get<Omit<AdminCreatorQueueResponse, 'creators'> & { creators: BackendAdminVerificationCreator[] }>('/api/v1/admin/creators', {
      query: {
        search: filters.search,
        verified: filters.status === 'verified' ? true : filters.status === 'unverified' ? false : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
    return {
      ...response,
      creators: response.creators.map(mapAdminVerificationCreator),
    };
  },

  async updateBrandVerification(id: string, status: string, contactEmail?: string, phoneNumber?: string) {
    return apiClient.patch(`/api/v1/admin/brands/${id}/verification`, {
      status,
      contactEmail,
      phoneNumber,
    });
  },

  async getBrandVerificationEvidence(id: string): Promise<AdminBrandVerificationEvidence> {
    return apiClient.get<AdminBrandVerificationEvidence>(`/api/v1/admin/brands/${id}/verification-evidence`);
  },

  async reviewBrandVerificationDocument(
    brandId: string,
    documentId: string,
    status: 'approved' | 'rejected' | 'pending',
    reason?: string,
  ): Promise<AdminVerificationDocument> {
    return apiClient.patch<AdminVerificationDocument>(
      `/api/v1/admin/brands/${brandId}/verification-documents/${documentId}`,
      { status, reason },
    );
  },

  async decideBrandVerification(
    brandId: string,
    decision: 'verified' | 'rejected' | 'under_review',
    reason?: string,
    contactEmail?: string,
    phoneNumber?: string,
  ): Promise<AdminVerificationBrand> {
    return apiClient.post<AdminVerificationBrand>(`/api/v1/admin/brands/${brandId}/verification-review`, {
      decision,
      reason,
      contactEmail,
      phoneNumber,
    });
  },

  async getVerificationBrands(filters: AdminVerificationFilters = {}): Promise<AdminBrandQueueResponse> {
    return apiClient.get<AdminBrandQueueResponse>('/api/v1/admin/brands', {
      query: {
        search: filters.search,
        verificationStatus: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async getAmbassadorApplications(filters: AdminVerificationFilters = {}): Promise<AmbassadorApplicationsResponse> {
    return apiClient.get<AmbassadorApplicationsResponse>('/api/v1/admin/ambassador/applications', {
      query: {
        search: filters.search,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async reviewAmbassadorApplication(id: string, status: string, notes?: string): Promise<AmbassadorApplication> {
    return apiClient.patch<AmbassadorApplication>(`/api/v1/admin/ambassador/applications/${id}`, { status, notes });
  },

  async getDisputes(filters: { search?: string; status?: string; page?: number; limit?: number } = {}): Promise<AdminDisputesResponse> {
    return apiClient.get<AdminDisputesResponse>('/api/v1/admin/disputes', {
      query: {
        search: filters.search,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async createDispute(input: { orderId: string; title: string; description: string; priority: string }): Promise<AdminDispute> {
    return apiClient.post<AdminDispute>('/api/v1/admin/disputes', input);
  },

  async updateDispute(
    id: string,
    input: {
      status?: DisputeStatus;
      priority?: AdminDispute['priority'];
      resolution?: DisputeResolution;
      resolutionNotes?: string;
      assignToMe?: boolean;
    },
  ): Promise<AdminDispute> {
    return apiClient.patch<AdminDispute>(`/api/v1/admin/disputes/${id}`, input);
  },

  async executeDisputeRefund(id: string, input: { amount?: number; reason: string }): Promise<AdminDispute> {
    return apiClient.post<AdminDispute>(`/api/v1/admin/disputes/${id}/refund`, input);
  },

  async getAuditLogs(filters: { search?: string; action?: string; page?: number; limit?: number } = {}): Promise<AdminAuditLogsResponse> {
    return apiClient.get<AdminAuditLogsResponse>('/api/v1/admin/audit-logs', {
      query: {
        search: filters.search,
        action: filters.action && filters.action !== 'all' ? filters.action : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async getPaymentAuditLogs(filters: { search?: string; action?: string; brandId?: string; page?: number; limit?: number } = {}): Promise<AdminPaymentAuditLogsResponse> {
    return apiClient.get<AdminPaymentAuditLogsResponse>('/api/v1/admin/payment-audit-logs', {
      query: {
        search: filters.search,
        action: filters.action && filters.action !== 'all' ? filters.action : undefined,
        brandId: filters.brandId,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async getPaymentsStats(): Promise<AdminPaymentsStats> {
    return apiClient.get<AdminPaymentsStats>('/api/v1/admin/payments/stats');
  },

  async getTransactions(filters: AdminTransactionFilters = {}): Promise<AdminTransactionsResponse> {
    return apiClient.get<AdminTransactionsResponse>('/api/v1/admin/payments/transactions', {
      query: {
        search: filters.search,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async getWithdrawals(filters: AdminWithdrawalFilters = {}): Promise<AdminWithdrawalsResponse> {
    return apiClient.get<AdminWithdrawalsResponse>('/api/v1/admin/payments/withdrawals', {
      query: {
        search: filters.search,
        status: filters.status && filters.status !== 'all' ? filters.status : undefined,
        page: filters.page ?? 0,
        limit: filters.limit ?? 20,
      },
    });
  },

  async processWithdrawal(id: string, status: string, stepUpToken?: string): Promise<AdminWithdrawal> {
    return apiClient.patch<AdminWithdrawal>(
      `/api/v1/admin/payments/withdrawals/${id}/status`,
      { status },
      { headers: stepUpToken ? { 'X-Step-Up-Token': stepUpToken } : undefined },
    );
  },

  async getSLAMetrics(): Promise<AdminSLAMetrics> {
    return apiClient.get<AdminSLAMetrics>('/api/v1/admin/sla-metrics');
  },

  async getApiLogs(filters?: {
    service?: string;
    status?: 'success' | 'error';
    page?: number;
    limit?: number;
  }): Promise<AdminApiLogsResponse> {
    const params = new URLSearchParams();
    if (filters?.service) params.set('service', filters.service);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.page !== undefined) params.set('page', String(filters.page));
    params.set('limit', String(filters?.limit ?? 50));
    const qs = params.toString();
    return apiClient.get<AdminApiLogsResponse>(`/api/v1/admin/api-logs${qs ? `?${qs}` : ''}`);
  },
};
