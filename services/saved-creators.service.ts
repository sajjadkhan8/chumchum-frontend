import { apiClient } from '@/lib/api/client';
import { mapCreator } from '@/lib/api/mappers';
import type { Creator } from '@/types';

interface SavedCreatorsResponse {
  creators?: unknown[];
  total?: number;
}

export interface SavedCreatorsList {
  creators: Creator[];
  total: number;
}

export const savedCreatorsService = {
  async getAll(): Promise<SavedCreatorsList> {
    const response = await apiClient.get<SavedCreatorsResponse | unknown[]>('/api/v1/saved-creators');
    const creators = Array.isArray(response) ? response : response.creators || [];

    return {
      creators: creators.map((creator) => mapCreator(creator as never)),
      total: Array.isArray(response) ? creators.length : response.total ?? creators.length,
    };
  },

  async save(creatorId: string): Promise<void> {
    await apiClient.post(`/api/v1/saved-creators/${creatorId}`);
  },

  async remove(creatorId: string): Promise<void> {
    await apiClient.delete(`/api/v1/saved-creators/${creatorId}`);
  },
};
