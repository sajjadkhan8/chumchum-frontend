import { apiClient } from '@/lib/api/client';
import { mapBrand, mapCreator, mapOrder, mapPackage } from '@/lib/api/mappers';
import type { DealType, Order, OrderStatus } from '@/types';

export type CreateOrderRequest = Record<string, unknown> & {
  packageId: string;
  dealType?: Uppercase<DealType>;
  amount?: number;
  barterDetails?: string;
  message?: string;
};

interface DeliverableResponse {
  id: string;
  order_id: string;
  name: string;
  status: string;
  file_url?: string;
  submitted_at?: string;
  created_at?: string;
}

interface BackendOrderResponse {
  id: string;
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
  deliveryDate?: string;
  createdAt?: string;
}

interface BackendDeliverableResponse {
  id: string;
  order_id: string;
  name: string;
  status: string;
  file_url?: string;
  submitted_at?: string;
  created_at?: string;
}

const mapDeliverable = (payload: BackendDeliverableResponse): DeliverableResponse => ({
  id: payload.id,
  order_id: payload.order_id,
  name: payload.name,
  status: payload.status,
  file_url: payload.file_url,
  submitted_at: payload.submitted_at,
  created_at: payload.created_at,
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

  async getAll(filters?: { status?: OrderStatus; search?: string }): Promise<Order[]> {
    const response = await apiClient.get<BackendOrderResponse[] | { orders?: BackendOrderResponse[] }>('/api/v1/orders', {
      query: {
        status: filters?.status,
        search: filters?.search,
      },
    });

    const orders = Array.isArray(response) ? response : response.orders || [];
    return enrichOrders(orders);
  },

  async getById(id: string): Promise<Order | null> {
    const response = await apiClient.get<BackendOrderResponse>(`/api/v1/orders/${id}`);
    const orders = await enrichOrders(response ? [response] : []);
    return orders[0] || null;
  },

  async getByCreatorId(creatorId: string): Promise<Order[]> {
    const orders = await this.getAll();
    return orders.filter((order) => order.creatorId === creatorId);
  },

  async getByBrandId(brandId: string): Promise<Order[]> {
    const orders = await this.getAll();
    return orders.filter((order) => order.brandId === brandId);
  },

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    return this.getAll({ status });
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/status`, {
      status: status.toUpperCase(),
    });

    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async updateProgress(orderId: string, progress: number): Promise<Order | null> {
    const response = await apiClient.patch<BackendOrderResponse>(`/api/v1/orders/${orderId}/progress`, { progress });
    const enriched = await enrichOrders(response ? [response] : []);
    return enriched[0] || null;
  },

  async submitDeliverable(orderId: string, deliverableId: string, payload: Record<string, string>) {
    const response = await apiClient.post<BackendDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/submit`,
      payload,
    );

    return mapDeliverable(response);
  },

  async updateDeliverableStatus(orderId: string, deliverableId: string, status: string) {
    const response = await apiClient.patch<BackendDeliverableResponse>(
      `/api/v1/orders/${orderId}/deliverables/${deliverableId}/status`,
      { status },
    );

    return mapDeliverable(response);
  },
};
