import { apiClient } from '@/lib/api/client';
import { mapBrand, mapCreator, mapOrder, mapPackage } from '@/lib/api/mappers';
import type { DealType, Order, OrderDeliverable, OrderStatus } from '@/types';

export interface CreateOrderRequest {
  packageId: string;
  dealType?: Uppercase<DealType>;
  amount?: number;
  barterDetails?: string;
  message?: string;
}

export interface UpdateOrderStatusRequest {
  status: Uppercase<OrderStatus>;
  progress_update?: string;
  message?: string;
}

export interface UpdateOrderProgressRequest {
  progress: number;
}

export interface SubmitDeliverableRequest {
  fileUrl?: string;
  note?: string;
}

export interface UpdateDeliverableStatusRequest {
  status: OrderDeliverable['status'];
  comment?: string;
}

interface BackendOrderResponse {
  id: string;
  orderNumber?: string;
  packageId: string;
  packageTitle?: string;
  creatorId: string;
  creatorName?: string;
  brandId: string;
  brandName?: string;
  dealType?: string;
  amount?: number;
  barterDetails?: string;
  message?: string;
  status?: string;
  progress?: number;
  deadlineDate?: string;
  deliveryDate?: string;
  createdAt?: string;
  deliverables?: BackendDeliverableResponse[];
  barterProductReceived?: boolean;
  conversationId?: string;
}

interface BackendDeliverableResponse {
  id: string;
  order_id: string;
  name: string;
  status: string;
  file_url?: string;
  submitted_at?: string;
  revision_note?: string;
  created_at?: string;
}

const normalizeDeliverableStatus = (value?: string): OrderDeliverable['status'] => {
  const lowered = (value || '').toLowerCase();
  if (lowered === 'in_progress' || lowered === 'completed' || lowered === 'revision' || lowered === 'review') {
    return lowered;
  }
  return 'pending';
};

const toOptionalDate = (value?: string): Date | undefined => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const mapDeliverable = (payload: BackendDeliverableResponse): OrderDeliverable => ({
  id: payload.id,
  orderId: payload.order_id,
  name: payload.name || 'Deliverable',
  status: normalizeDeliverableStatus(payload.status),
  fileUrl: payload.file_url,
  submittedAt: toOptionalDate(payload.submitted_at),
  revisionNote: payload.revision_note,
  createdAt: toOptionalDate(payload.created_at),
});

const enrichOrders = async (orders: BackendOrderResponse[]): Promise<Order[]> => {
  const uniqueCreatorIds = [...new Set(orders.map((order) => order.creatorId).filter(Boolean))];
  const uniqueBrandIds = [...new Set(orders.map((order) => order.brandId).filter(Boolean))];
  const uniquePackageIds = [...new Set(orders.map((order) => order.packageId).filter(Boolean))];

  const [creators, brands, packages] = await Promise.all([
    Promise.allSettled(uniqueCreatorIds.map((id) => apiClient.get<unknown>(`/api/v1/creators/${id}`))),
    Promise.allSettled(uniqueBrandIds.map((id) => apiClient.get<unknown>(`/api/v1/brands/${id}`))),
    Promise.allSettled(uniquePackageIds.map((id) => apiClient.get<unknown>(`/api/v1/packages/${id}`))),
  ]);

  const creatorMap = uniqueCreatorIds.reduce<Record<string, ReturnType<typeof mapCreator>>>((acc, id, index) => {
    const result = creators[index];
    if (result.status === 'fulfilled') {
      acc[id] = mapCreator(result.value as never);
    }
    return acc;
  }, {});

  const brandMap = uniqueBrandIds.reduce<Record<string, ReturnType<typeof mapBrand>>>((acc, id, index) => {
    const result = brands[index];
    if (result.status === 'fulfilled') {
      acc[id] = mapBrand(result.value as never);
    }
    return acc;
  }, {});

  const packageMap = uniquePackageIds.reduce<Record<string, ReturnType<typeof mapPackage>>>((acc, id, index) => {
    const result = packages[index];
    if (result.status === 'fulfilled') {
      acc[id] = mapPackage(result.value as never);
    }
    return acc;
  }, {});

  return orders.map((order) => mapOrder(order, packageMap, creatorMap, brandMap));
};

export const ordersService = {
  async create(payload: CreateOrderRequest): Promise<Order | null> {
    const response = await apiClient.post<BackendOrderResponse>('/api/v1/orders', payload);
    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async getAll(filters?: { status?: OrderStatus; search?: string; page?: number; limit?: number }): Promise<{ orders: Order[]; total: number; hasMore: boolean }> {
    type PaginatedResponse = { orders?: BackendOrderResponse[]; content?: BackendOrderResponse[]; total?: number; totalElements?: number };
    const page = filters?.page ?? 0;
    const limit = filters?.limit ?? 20;

    const response = await apiClient.get<BackendOrderResponse[] | PaginatedResponse>('/api/v1/orders', {
      query: {
        status: filters?.status ? filters.status.toUpperCase() : undefined,
        search: filters?.search || undefined,
        page,
        limit,
      },
    });

    let raw: BackendOrderResponse[];
    let total: number;

    if (Array.isArray(response)) {
      raw = response;
      total = response.length < limit ? page * limit + response.length : (page + 1) * limit + 1;
    } else {
      const r = response as PaginatedResponse;
      raw = r.orders ?? r.content ?? [];
      total = r.total ?? r.totalElements ?? raw.length;
    }

    const orders = await enrichOrders(raw);
    return { orders, total, hasMore: (page + 1) * limit < total };
  },

  async getById(id: string): Promise<Order | null> {
    const response = await apiClient.get<BackendOrderResponse>(`/api/v1/orders/${id}`);
    const orders = await enrichOrders(response ? [response] : []);
    return orders[0] || null;
  },

  async getByCreatorId(creatorId: string): Promise<Order[]> {
    const { orders } = await this.getAll({ limit: 200 });
    return orders.filter((order) => order.creatorId === creatorId);
  },

  async getByBrandId(brandId: string): Promise<Order[]> {
    const { orders } = await this.getAll({ limit: 200 });
    return orders.filter((order) => order.brandId === brandId);
  },

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    const { orders } = await this.getAll({ status });
    return orders;
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const payload: UpdateOrderStatusRequest = { status: status.toUpperCase() as Uppercase<OrderStatus> };
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/status`, {
      ...payload,
    });

    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async updateProgress(orderId: string, progress: number): Promise<Order | null> {
    const payload: UpdateOrderProgressRequest = { progress };
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/progress`, payload);
    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async submitDeliverable(orderId: string, deliverableId: string, payload: SubmitDeliverableRequest): Promise<OrderDeliverable> {
    const response = await apiClient.post<BackendDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/submit`,
      payload,
    );

    return mapDeliverable(response);
  },

  async updateDeliverableStatus(orderId: string, deliverableId: string, status: OrderDeliverable['status'], comment?: string): Promise<OrderDeliverable> {
    const payload: UpdateDeliverableStatusRequest = { status, ...(comment ? { comment } : {}) };
    const response = await apiClient.patch<BackendDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/status`,
      payload,
    );

    return mapDeliverable(response);
  },

  async confirmBarterReceipt(orderId: string): Promise<Order | null> {
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/barter-confirm`);
    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async downloadReceipt(orderId: string): Promise<Blob> {
    const { blob } = await apiClient.download(`/api/v1/orders/${orderId}/receipt`);
    return blob;
  },
};
