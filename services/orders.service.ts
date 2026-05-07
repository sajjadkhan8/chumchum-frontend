import type { Order, OrderStatus } from '@/types';
import { mockCreators } from '@/data/creators';
import { mockBrands } from '@/data/brands';
import { mockPackages } from '@/data/packages';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate mock orders
const generateMockOrders = (): Order[] => {
  const statuses: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'delivered', 'completed'];
  const orders: Order[] = [];

  for (let i = 1; i <= 8; i++) {
    const pkg = mockPackages[i % mockPackages.length];
    const creator = mockCreators.find((c) => c.id === pkg.creatorId)!;
    const brand = mockBrands[i % mockBrands.length];

    orders.push({
      id: `order-${i}`,
      packageId: pkg.id,
      package: pkg,
      creatorId: creator.id,
      creator,
      brandId: brand.id,
      brand,
      dealType: pkg.dealType,
      amount: pkg.price || undefined,
      barterDetails: pkg.barterValue,
      message: `Looking forward to working with you on this ${pkg.dealType} deal!`,
      status: statuses[i % statuses.length],
      createdAt: new Date(Date.now() - i * 86400000 * 2),
      updatedAt: new Date(Date.now() - i * 86400000),
      deliveryDate: new Date(Date.now() + pkg.deliveryDays * 86400000),
    });
  }

  return orders;
};

const mockOrders = generateMockOrders();

export const ordersService = {
  async getAll(): Promise<Order[]> {
    await delay(600);
    return mockOrders;
  },

  async getById(id: string): Promise<Order | null> {
    await delay(300);
    return mockOrders.find((order) => order.id === id) || null;
  },

  async getByCreatorId(creatorId: string): Promise<Order[]> {
    await delay(500);
    return mockOrders.filter((order) => order.creatorId === creatorId);
  },

  async getByBrandId(brandId: string): Promise<Order[]> {
    await delay(500);
    return mockOrders.filter((order) => order.brandId === brandId);
  },

  async getByStatus(status: OrderStatus): Promise<Order[]> {
    await delay(400);
    return mockOrders.filter((order) => order.status === status);
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    await delay(300);
    const order = mockOrders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date();
    }
    return order || null;
  },
};
