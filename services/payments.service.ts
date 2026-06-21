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

type CreatorPayoutPreferencesResponse = Partial<CreatorPayoutPreferences> & {
  accountHolderName?: string | null;
  ntnNumber?: string | null;
  cnicLast4?: string | null;
};

const normalizeCreatorPayoutPreferences = (
  input: CreatorPayoutPreferencesResponse,
): CreatorPayoutPreferences => ({
  autoWithdrawEnabled: Boolean(input.autoWithdrawEnabled),
  payoutSchedule: input.payoutSchedule || 'manual',
  minimumPayoutAmount: Number(input.minimumPayoutAmount || 5000),
  accountHolderName: input.accountHolderName ?? '',
  ntnNumber: input.ntnNumber ?? '',
  cnicLast4: input.cnicLast4 ?? '',
  earningsNotificationsEnabled: input.earningsNotificationsEnabled ?? true,
  weeklyDigestEnabled: Boolean(input.weeklyDigestEnabled),
});

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
    const response = await apiClient.get<CreatorPayoutPreferencesResponse>('/api/v1/creators/me/payout-preferences');
    return normalizeCreatorPayoutPreferences(response);
  },

  async updateCreatorPayoutPreferences(payload: CreatorPayoutPreferences): Promise<CreatorPayoutPreferences> {
    const response = await apiClient.patch<CreatorPayoutPreferencesResponse>('/api/v1/creators/me/payout-preferences', payload);
    return normalizeCreatorPayoutPreferences(response);
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

  // ─── Safepay Express Checkout ──────────────────────────────────────────────

  /**
   * Initiates a Safepay checkout session for a wallet top-up.
   * Returns a checkoutUrl to redirect the brand to Safepay's hosted payment page.
   */
  async initiateSafepayTopup(amount: number): Promise<SafepayCheckoutSession> {
    return apiClient.post<SafepayCheckoutSession>('/api/v1/payments/safepay/initiate-topup', { amount });
  },

  /**
   * Polls the status of a Safepay payment session.
   * Call after redirect from Safepay until status is 'completed' or 'failed'.
   */
  async getSafepaySessionStatus(sessionId: string): Promise<SafepaySessionStatus> {
    return apiClient.get<SafepaySessionStatus>(`/api/v1/payments/safepay/session/${sessionId}`);
  },

  /** Records a cancellation when the brand returns via the cancel URL. */
  async cancelSafepaySession(sessionId: string): Promise<void> {
    await apiClient.post(`/api/v1/payments/safepay/session/${sessionId}/cancel`, {});
  },

  async getInvoiceDetail(invoiceId: string): Promise<BrandInvoice & { lineItems?: { description: string; amount: number }[] }> {
    return apiClient.get<BrandInvoice & { lineItems?: { description: string; amount: number }[] }>(
      `/api/v1/brand/payments/invoices/${invoiceId}`,
    );
  },
};

// ─── Safepay types ─────────────────────────────────────────────────────────────

export interface SafepayCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
  trackerToken: string;
  expiresAt: string;
}

export type SafepayPaymentStatus = 'initiated' | 'completed' | 'failed' | 'cancelled' | 'expired';

export interface SafepaySessionStatus {
  sessionId: string;
  status: SafepayPaymentStatus;
  amountPkr: number;
  paymentType: 'wallet_topup' | 'order_payment';
  completedAt: string | null;
  failureReason: string | null;
}
