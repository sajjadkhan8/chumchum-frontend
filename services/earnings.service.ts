import { apiClient } from '@/lib/api/client';

export type PayoutMethodType = 'STCPAY' | 'MADA' | 'APPLEPAY' | 'BANK_TRANSFER';

export interface EarningsSummary {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  platformFees: number;
}

export interface EarningTransaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'refund' | 'platform_fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PayoutMethod {
  id: string;
  type: string;
  name: string;
  accountDetails: string;
  isDefault: boolean;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payoutMethodId: string;
  processedAt?: string | null;
  createdAt: string;
}

interface TransactionPage {
  transactions?: EarningTransaction[];
  total?: number;
  page?: number;
  limit?: number;
}

interface WithdrawalPage {
  withdrawals?: WithdrawalRequest[];
  total?: number;
  page?: number;
  limit?: number;
}

export const earningsService = {
  async getSummary(): Promise<EarningsSummary> {
    return apiClient.get<EarningsSummary>('/api/v1/earnings/summary');
  },

  async getTransactions(page = 0, limit = 100): Promise<EarningTransaction[]> {
    const response = await apiClient.get<TransactionPage>('/api/v1/earnings/transactions', {
      query: { page, limit },
    });
    return response.transactions || [];
  },

  async getPayoutMethods(): Promise<PayoutMethod[]> {
    return apiClient.get<PayoutMethod[]>('/api/v1/payout-methods');
  },

  async createPayoutMethod(payload: {
    type: PayoutMethodType;
    name: string;
    accountDetails: string;
    isDefault?: boolean;
  }): Promise<PayoutMethod> {
    return apiClient.post<PayoutMethod>('/api/v1/payout-methods', {
      type: payload.type,
      name: payload.name,
      accountDetails: payload.accountDetails,
      isDefault: Boolean(payload.isDefault),
    });
  },

  async requestWithdrawal(payload: { payoutMethodId: string; amount: number }): Promise<WithdrawalRequest> {
    return apiClient.post<WithdrawalRequest>('/api/v1/withdrawals', {
      payoutMethodId: payload.payoutMethodId,
      amount: payload.amount,
    });
  },

  async getWithdrawals(page = 0, limit = 100): Promise<WithdrawalRequest[]> {
    const response = await apiClient.get<WithdrawalPage>('/api/v1/withdrawals', {
      query: { page, limit },
    });
    return response.withdrawals || [];
  },
};
