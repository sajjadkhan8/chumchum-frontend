import { apiClient } from '@/lib/api/client';
import type { Brand, City, Review } from '@/types';

interface BackendReview {
  id: string;
  creatorId?: string;
  brandId?: string;
  orderId?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
  brand?: {
    id?: string;
    name?: string;
    logo?: string;
    industry?: string;
    city?: string;
    description?: string;
  };
}

const fallbackBrand = (brandId: string): Brand => ({
  id: brandId,
  userId: brandId,
  name: 'Brand',
  logo: '',
  industry: 'General',
  city: 'Karachi' as City,
  description: '',
  totalCampaigns: 0,
  activeOrders: 0,
});

const mapReview = (input: BackendReview, creatorId: string): Review => {
  const brandId = input.brandId || 'unknown-brand';
  return {
    id: input.id,
    creatorId: input.creatorId || creatorId,
    brandId,
    brand: input.brand
      ? {
          ...fallbackBrand(brandId),
          id: input.brand.id || brandId,
          name: input.brand.name || 'Brand',
          logo: input.brand.logo || '',
          industry: input.brand.industry || 'General',
          city: (input.brand.city as City) || 'Karachi',
          description: input.brand.description || '',
        }
      : fallbackBrand(brandId),
    orderId: input.orderId || '',
    rating: input.rating || 0,
    comment: input.comment || '',
    createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
  };
};

const unwrapReviews = (payload: unknown): BackendReview[] => {
  if (Array.isArray(payload)) return payload as BackendReview[];
  const objectPayload = payload as { content?: BackendReview[]; reviews?: BackendReview[]; data?: BackendReview[] };
  return objectPayload.content || objectPayload.reviews || objectPayload.data || [];
};

export const reviewsService = {
  async create(payload: { orderId: string; rating: number; comment?: string }): Promise<Review> {
    const response = await apiClient.post<{ review?: BackendReview } | BackendReview>('/api/v1/reviews', {
      orderId: payload.orderId,
      rating: payload.rating,
      comment: payload.comment,
    });

    const review = 'review' in response && response.review ? response.review : response;
    return mapReview(review as BackendReview, (review as BackendReview).creatorId || '');
  },

  async getByCreatorId(creatorId: string): Promise<Review[]> {
    if (!creatorId) return [];

    const endpoints = [`/api/v1/creators/${creatorId}/reviews`, '/api/v1/reviews'];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.get<unknown>(endpoint, {
          auth: false,
          query: endpoint.endsWith('/reviews') ? undefined : { creatorId, page: 0, size: 50 },
        });
        return unwrapReviews(response).map((review) => mapReview(review, creatorId));
      } catch {
        // Try the next endpoint.
      }
    }

    return [];
  },
};
