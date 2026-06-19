import { apiClient } from '@/lib/api/client';

export type AlertRuleType =
  | 'reaction_threshold'
  | 'no_reactions'
  | 'low_acceptance_rate'
  | 'spend_exceeded';

export interface CampaignAlertRule {
  id: string;
  campaignId: string;
  type: AlertRuleType;
  threshold: number;
  isActive: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface CreateAlertRuleInput {
  type: AlertRuleType;
  threshold: number;
}

export const ALERT_TYPE_LABELS: Record<AlertRuleType, string> = {
  reaction_threshold: 'Reaction count reaches',
  no_reactions: 'No reactions after',
  low_acceptance_rate: 'Acceptance rate drops below',
  spend_exceeded: 'Spend exceeds budget by',
};

export const ALERT_TYPE_UNITS: Record<AlertRuleType, string> = {
  reaction_threshold: 'reactions',
  no_reactions: 'days',
  low_acceptance_rate: '%',
  spend_exceeded: '%',
};

export const campaignAlertsService = {
  async getAlertRules(campaignId: string): Promise<CampaignAlertRule[]> {
    const result = await apiClient
      .get<CampaignAlertRule[]>(`/api/v1/brand/campaigns/${campaignId}/alerts`)
      .catch(() => null);
    return result ?? [];
  },

  async createAlertRule(campaignId: string, input: CreateAlertRuleInput): Promise<CampaignAlertRule> {
    return apiClient.post<CampaignAlertRule>(`/api/v1/brand/campaigns/${campaignId}/alerts`, input);
  },

  async toggleAlertRule(
    campaignId: string,
    ruleId: string,
    isActive: boolean,
  ): Promise<CampaignAlertRule> {
    return apiClient.patch<CampaignAlertRule>(
      `/api/v1/brand/campaigns/${campaignId}/alerts/${ruleId}`,
      { isActive },
    );
  },

  async deleteAlertRule(campaignId: string, ruleId: string): Promise<void> {
    await apiClient.delete(`/api/v1/brand/campaigns/${campaignId}/alerts/${ruleId}`);
  },
};
