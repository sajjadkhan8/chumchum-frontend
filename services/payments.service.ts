import { apiClient } from '@/lib/api/client';

export type CreatorPayoutSchedule = 'weekly' | 'biweekly' | 'monthly' | 'manual';

export interface CreatorPayoutPreferences {
  autoWithdrawEnabled: boolean;
  payoutSchedule: CreatorPayoutSchedule;
  minimumPayoutAmount: number;
  accountHolderName: string;
  ntnNumber: string;
  cnicLast4: string;
  earningsNotificationsEnabled: boolean;
  weeklyDigestEnabled: boolean;
}

export type BrandPaymentMethodType =
  | 'card'
  | 'bank_transfer'
  | 'jazzcash'
  | 'easypaisa'
  | 'sadapay'
  | 'nayapay';

export interface BrandPaymentMethod {
  id: string;
  type: BrandPaymentMethodType;
  label: string;
  accountMask: string;
  holderName: string;
  isDefault: boolean;
  status: 'active' | 'pending_verification' | 'disabled';
  createdAt: string;
}

export interface BrandPaymentSummary {
  walletBalance: number;
  monthlySpend: number;
  pendingEscrow: number;
  processingPayouts: number;
  nextInvoiceDate: string;
}

export interface BrandInvoice {
  id: string;
  periodLabel: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue';
  issuedAt: string;
  dueAt: string;
}

export interface BrandDisbursement {
  id: string;
  creatorName: string;
  campaignName: string;
  amount: number;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  releaseDate: string;
}

export interface BrandPayoutControls {
  requireTwoApprovals: boolean;
  autoReleaseAfterDays: number;
  lowBalanceAlertThreshold: number;
}

export interface BrandPaymentsHub {
  summary: BrandPaymentSummary;
  methods: BrandPaymentMethod[];
  invoices: BrandInvoice[];
  disbursements: BrandDisbursement[];
  controls: BrandPayoutControls;
}

export interface CreateBrandPaymentMethodInput {
  type: BrandPaymentMethodType;
  label: string;
  accountMask: string;
  holderName: string;
  isDefault?: boolean;
}

export const paymentsService = {
  async getCreatorPayoutPreferences(): Promise<CreatorPayoutPreferences> {
    return apiClient.get<CreatorPayoutPreferences>('/api/v1/creators/me/payout-preferences');
  },

  async updateCreatorPayoutPreferences(payload: CreatorPayoutPreferences): Promise<CreatorPayoutPreferences> {
    return apiClient.patch<CreatorPayoutPreferences>('/api/v1/creators/me/payout-preferences', payload);
  },

  async getBrandPaymentsHub(): Promise<BrandPaymentsHub> {
    const [summary, methods, invoices, disbursements, controls] = await Promise.all([
      apiClient.get<BrandPaymentSummary>('/api/v1/brands/me/payments/summary'),
      apiClient.get<BrandPaymentMethod[]>('/api/v1/brands/me/payments/methods'),
      apiClient.get<BrandInvoice[]>('/api/v1/brands/me/payments/invoices'),
      apiClient.get<BrandDisbursement[]>('/api/v1/brands/me/payments/disbursements'),
      apiClient.get<BrandPayoutControls>('/api/v1/brands/me/payments/controls'),
    ]);

    return { summary, methods, invoices, disbursements, controls };
  },

  async addBrandPaymentMethod(payload: CreateBrandPaymentMethodInput): Promise<BrandPaymentMethod> {
    return apiClient.post<BrandPaymentMethod>('/api/v1/brands/me/payments/methods', payload);
  },

  async setBrandDefaultMethod(methodId: string): Promise<void> {
    await apiClient.patch(`/api/v1/brands/me/payments/methods/${methodId}`, { isDefault: true });
  },

  async removeBrandMethod(methodId: string): Promise<void> {
    await apiClient.delete(`/api/v1/brands/me/payments/methods/${methodId}`);
  },

  async topUpBrandWallet(amount: number): Promise<BrandPaymentSummary> {
    return apiClient.post<BrandPaymentSummary>('/api/v1/brands/me/payments/top-up', { amount });
  },

  async updateBrandPayoutControls(payload: BrandPayoutControls): Promise<BrandPayoutControls> {
    return apiClient.patch<BrandPayoutControls>('/api/v1/brands/me/payments/controls', payload);
  },
};
