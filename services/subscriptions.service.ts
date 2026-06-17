import { apiClient } from '@/lib/api/client';
import type { Subscription } from '@/types';

interface RawSubscription {
  id: string;
  brand_id: string;
  package_id: string;
  package_title: string;
  status: string;
  interval: string;
  duration: number;
  cycles_completed: number;
  next_renewal_at: string;
  cancelled_at?: string;
  created_at: string;
}

interface SubscriptionEnvelope {
  success?: boolean;
  data?: RawSubscription | RawSubscription[];
}

const mapSubscription = (raw: RawSubscription): Subscription => ({
  id: raw.id,
  brandId: raw.brand_id,
  packageId: raw.package_id,
  packageTitle: raw.package_title,
  status: raw.status as Subscription['status'],
  interval: raw.interval as Subscription['interval'],
  duration: raw.duration,
  cyclesCompleted: raw.cycles_completed,
  nextRenewalAt: raw.next_renewal_at,
  cancelledAt: raw.cancelled_at,
  createdAt: raw.created_at,
});

export const subscriptionsService = {
  async subscribe(packageId: string): Promise<Subscription> {
    const response = await apiClient.post<SubscriptionEnvelope>('/api/v1/subscriptions', undefined, {
      query: { packageId },
    });
    const raw = (response as SubscriptionEnvelope)?.data ?? (response as unknown as RawSubscription);
    return mapSubscription(raw as RawSubscription);
  },

  async getMySubscriptions(): Promise<Subscription[]> {
    const response = await apiClient.get<SubscriptionEnvelope | RawSubscription[]>('/api/v1/subscriptions');
    const envelope = response as SubscriptionEnvelope;
    const data = Array.isArray(envelope?.data)
      ? (envelope.data as RawSubscription[])
      : Array.isArray(response)
      ? (response as RawSubscription[])
      : [];
    return data.map(mapSubscription);
  },

  async cancel(subscriptionId: string): Promise<Subscription> {
    const response = await apiClient.delete<SubscriptionEnvelope>(`/api/v1/subscriptions/${subscriptionId}`);
    const raw = (response as SubscriptionEnvelope)?.data ?? (response as unknown as RawSubscription);
    return mapSubscription(raw as RawSubscription);
  },
};
