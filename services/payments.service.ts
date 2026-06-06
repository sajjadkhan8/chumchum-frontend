import { ApiError, apiClient } from '@/lib/api/client';

export type CreatorPayoutSchedule = 'weekly' | 'biweekly' | 'monthly' | 'manual';

export interface CreatorPayoutPreferences {
  autoWithdrawEnabled: boolean;
  payoutSchedule: CreatorPayoutSchedule;
  minimumPayoutAmount: number;
  accountHolderName: string;
  ntnNumber: string;
  cnicLast4: string;
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

interface BrandPaymentsHub {
  summary: BrandPaymentSummary;
  methods: BrandPaymentMethod[];
  invoices: BrandInvoice[];
  disbursements: BrandDisbursement[];
  controls: BrandPayoutControls;
}

const defaultCreatorPreferences: CreatorPayoutPreferences = {
  autoWithdrawEnabled: false,
  payoutSchedule: 'manual',
  minimumPayoutAmount: 5000,
  accountHolderName: '',
  ntnNumber: '',
  cnicLast4: '',
};

const localBrandSeed: BrandPaymentsHub = {
  summary: {
    walletBalance: 840000,
    monthlySpend: 1265000,
    pendingEscrow: 475000,
    processingPayouts: 135000,
    nextInvoiceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  methods: [
    {
      id: 'pm_card_visa_4242',
      type: 'card',
      label: 'Visa Corporate Card',
      accountMask: '**** **** **** 4242',
      holderName: 'Karachi Gourmet Group',
      isDefault: true,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'pm_bank_hbl_9911',
      type: 'bank_transfer',
      label: 'HBL Operating Account',
      accountMask: 'PK36HABB0001123456789911',
      holderName: 'Karachi Gourmet Group',
      isDefault: false,
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  invoices: [
    {
      id: 'inv_2026_05',
      periodLabel: 'May 2026',
      amount: 1420000,
      status: 'due',
      issuedAt: new Date('2026-06-01').toISOString(),
      dueAt: new Date('2026-06-10').toISOString(),
    },
    {
      id: 'inv_2026_04',
      periodLabel: 'April 2026',
      amount: 1190000,
      status: 'paid',
      issuedAt: new Date('2026-05-01').toISOString(),
      dueAt: new Date('2026-05-10').toISOString(),
    },
  ],
  disbursements: [
    {
      id: 'dsb_1',
      creatorName: 'Areeba Khan',
      campaignName: 'Summer Launch UGC',
      amount: 95000,
      status: 'processing',
      releaseDate: new Date().toISOString(),
    },
    {
      id: 'dsb_2',
      creatorName: 'Hassan Ali',
      campaignName: 'TikTok Creator Sprint',
      amount: 65000,
      status: 'scheduled',
      releaseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ],
  controls: {
    requireTwoApprovals: true,
    autoReleaseAfterDays: 5,
    lowBalanceAlertThreshold: 350000,
  },
};

const BRAND_STORAGE_KEY = 'chumchum-brand-payments-v1';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const loadLocalBrandPayments = (): BrandPaymentsHub => {
  if (!canUseStorage()) return localBrandSeed;
  const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
  if (!raw) return localBrandSeed;

  try {
    return JSON.parse(raw) as BrandPaymentsHub;
  } catch {
    return localBrandSeed;
  }
};

const saveLocalBrandPayments = (payload: BrandPaymentsHub) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(payload));
};

const shouldUseBrandFallback = (error: unknown) =>
  error instanceof ApiError && [400, 403, 404, 405, 501].includes(error.status);

export interface CreateBrandPaymentMethodInput {
  type: BrandPaymentMethodType;
  label: string;
  accountMask: string;
  holderName: string;
  isDefault?: boolean;
}

const normalizeBrandMethod = (method: CreateBrandPaymentMethodInput): BrandPaymentMethod => ({
  id: `pm_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
  type: method.type,
  label: method.label,
  accountMask: method.accountMask,
  holderName: method.holderName,
  isDefault: Boolean(method.isDefault),
  status: 'active',
  createdAt: new Date().toISOString(),
});

export const paymentsService = {
  async getCreatorPayoutPreferences(): Promise<CreatorPayoutPreferences> {
    try {
      return await apiClient.get<CreatorPayoutPreferences>('/api/v1/creators/me/payout-preferences');
    } catch (error) {
      if (error instanceof ApiError && [404, 405, 501].includes(error.status)) {
        return defaultCreatorPreferences;
      }
      throw error;
    }
  },

  async updateCreatorPayoutPreferences(payload: CreatorPayoutPreferences): Promise<CreatorPayoutPreferences> {
    try {
      return await apiClient.patch<CreatorPayoutPreferences>('/api/v1/creators/me/payout-preferences', payload);
    } catch (error) {
      if (error instanceof ApiError && [404, 405, 501].includes(error.status)) {
        return payload;
      }
      throw error;
    }
  },

  async getBrandPaymentsHub(): Promise<BrandPaymentsHub> {
    try {
      const [summary, methods, invoices, disbursements, controls] = await Promise.all([
        apiClient.get<BrandPaymentSummary>('/api/v1/brands/me/payments/summary'),
        apiClient.get<BrandPaymentMethod[]>('/api/v1/brands/me/payments/methods'),
        apiClient.get<BrandInvoice[]>('/api/v1/brands/me/payments/invoices'),
        apiClient.get<BrandDisbursement[]>('/api/v1/brands/me/payments/disbursements'),
        apiClient.get<BrandPayoutControls>('/api/v1/brands/me/payments/controls'),
      ]);

      return { summary, methods, invoices, disbursements, controls };
    } catch (error) {
      if (shouldUseBrandFallback(error)) {
        return loadLocalBrandPayments();
      }
      throw error;
    }
  },

  async addBrandPaymentMethod(payload: CreateBrandPaymentMethodInput): Promise<BrandPaymentMethod> {
    try {
      return await apiClient.post<BrandPaymentMethod>('/api/v1/brands/me/payments/methods', payload);
    } catch (error) {
      if (!shouldUseBrandFallback(error)) throw error;
      const state = loadLocalBrandPayments();
      const next = normalizeBrandMethod(payload);
      const nextMethods = payload.isDefault
        ? [next, ...state.methods.map((item) => ({ ...item, isDefault: false }))]
        : [...state.methods, next];
      saveLocalBrandPayments({ ...state, methods: nextMethods });
      return next;
    }
  },

  async setBrandDefaultMethod(methodId: string): Promise<void> {
    try {
      await apiClient.patch(`/api/v1/brands/me/payments/methods/${methodId}`, { isDefault: true });
      return;
    } catch (error) {
      if (!shouldUseBrandFallback(error)) throw error;
      const state = loadLocalBrandPayments();
      saveLocalBrandPayments({
        ...state,
        methods: state.methods.map((method) => ({ ...method, isDefault: method.id === methodId })),
      });
    }
  },

  async removeBrandMethod(methodId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/brands/me/payments/methods/${methodId}`);
      return;
    } catch (error) {
      if (!shouldUseBrandFallback(error)) throw error;
      const state = loadLocalBrandPayments();
      const nextMethods = state.methods.filter((method) => method.id !== methodId);
      if (nextMethods.length > 0 && !nextMethods.some((method) => method.isDefault)) {
        nextMethods[0] = { ...nextMethods[0], isDefault: true };
      }
      saveLocalBrandPayments({ ...state, methods: nextMethods });
    }
  },

  async topUpBrandWallet(amount: number): Promise<BrandPaymentSummary> {
    try {
      return await apiClient.post<BrandPaymentSummary>('/api/v1/brands/me/payments/top-up', { amount });
    } catch (error) {
      if (!shouldUseBrandFallback(error)) throw error;
      const state = loadLocalBrandPayments();
      const nextSummary: BrandPaymentSummary = {
        ...state.summary,
        walletBalance: state.summary.walletBalance + amount,
      };
      saveLocalBrandPayments({ ...state, summary: nextSummary });
      return nextSummary;
    }
  },

  async updateBrandPayoutControls(payload: BrandPayoutControls): Promise<BrandPayoutControls> {
    try {
      return await apiClient.patch<BrandPayoutControls>('/api/v1/brands/me/payments/controls', payload);
    } catch (error) {
      if (!shouldUseBrandFallback(error)) throw error;
      const state = loadLocalBrandPayments();
      saveLocalBrandPayments({ ...state, controls: payload });
      return payload;
    }
  },
};

