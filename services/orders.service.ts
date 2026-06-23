import { apiClient } from '@/lib/api/client';
import { mapOrder, mapOrderDeliverable, type BackendOrderDeliverableResponse } from '@/lib/api/mappers';
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
  updatedAt?: string;
  deliverables?: BackendOrderDeliverableResponse[];
  barterProductReceived?: boolean;
  conversationId?: string;
  hasReviewedByBrand?: boolean;
  hasReviewedByCreator?: boolean;
}



export const ordersService = {
  async create(payload: CreateOrderRequest): Promise<Order | null> {
    const response = await apiClient.post<BackendOrderResponse>('/api/v1/orders', payload);
    return response ? mapOrder(response as never, {}, {}, {}) : null;
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

    const orders = raw.map((o) => mapOrder(o as never, {}, {}, {}));
    return { orders, total, hasMore: (page + 1) * limit < total };
  },

  async getById(id: string): Promise<Order | null> {
    const response = await apiClient.get<BackendOrderResponse>(`/api/v1/orders/${id}`);
    return response ? mapOrder(response as never, {}, {}, {}) : null;
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

    return response ? mapOrder(response as never, {}, {}, {}) : null;
  },

  async updateProgress(orderId: string, progress: number): Promise<Order | null> {
    const payload: UpdateOrderProgressRequest = { progress };
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/progress`, payload);
    return response ? mapOrder(response as never, {}, {}, {}) : null;
  },

  async submitDeliverable(orderId: string, deliverableId: string, payload: SubmitDeliverableRequest): Promise<OrderDeliverable> {
    const response = await apiClient.post<BackendOrderDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/submit`,
      payload,
    );

    return mapOrderDeliverable(response);
  },

  async updateDeliverableStatus(orderId: string, deliverableId: string, status: OrderDeliverable['status'], comment?: string): Promise<OrderDeliverable> {
    const payload: UpdateDeliverableStatusRequest = { status, ...(comment ? { comment } : {}) };
    const response = await apiClient.patch<BackendOrderDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/status`,
      payload,
    );

    return mapOrderDeliverable(response);
  },

  async confirmBarterReceipt(orderId: string): Promise<Order | null> {
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/barter-confirm`);
    return response ? mapOrder(response as never, {}, {}, {}) : null;
  },

  async downloadReceipt(orderId: string): Promise<Blob> {
    const { blob } = await apiClient.download(`/api/v1/orders/${orderId}/receipt`);
    return blob;
  },
};
