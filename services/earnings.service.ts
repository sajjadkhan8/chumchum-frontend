import { apiClient } from '@/lib/api/client';

export type PayoutMethodType =
  | 'JAZZCASH'
  | 'EASYPAISA'
  | 'SADAPAY'
  | 'NAYAPAY'
  | 'STCPAY'
  | 'MADA'
  | 'APPLEPAY'
  | 'BANK_TRANSFER';

export interface EarningsSummary {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  platformFees: number;
  awaitingApprovalGross: number;
  awaitingApprovalNet: number;
  awaitingApprovalFees: number;
  awaitingApprovalCount: number;
}

export interface EarningTransaction {
  id: string;
  type: 'earning' | 'affiliate_commission' | 'withdrawal' | 'refund' | 'platform_fee';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface PayoutMethod {
  id: string;
  type: Lowercase<PayoutMethodType> | PayoutMethodType | string;
  name: string;
  accountDetails: string;
  bankName?: string | null;
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

export interface CreatePayoutMethodRequest {
  type: PayoutMethodType;
  name: string;
  accountDetails: string;
  bankName?: string;
  isDefault?: boolean;
}

export interface CreateWithdrawalRequest {
  payoutMethodId: string;
  amount: number;
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

  async createPayoutMethod(payload: CreatePayoutMethodRequest): Promise<PayoutMethod> {
    return apiClient.post<PayoutMethod>('/api/v1/payout-methods', {
      type: payload.type,
      name: payload.name,
      accountDetails: payload.accountDetails,
      bankName: payload.bankName,
      isDefault: Boolean(payload.isDefault),
    });
  },

  async updatePayoutMethod(id: string, payload: Partial<Pick<PayoutMethod, 'name' | 'accountDetails' | 'isDefault'>>): Promise<PayoutMethod> {
    return apiClient.patch<PayoutMethod>(`/api/v1/payout-methods/${id}`, {
      name: payload.name,
      accountDetails: payload.accountDetails,
      isDefault: payload.isDefault,
    });
  },

  async deletePayoutMethod(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/payout-methods/${id}`);
  },

  async requestWithdrawal(payload: CreateWithdrawalRequest): Promise<WithdrawalRequest> {
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
