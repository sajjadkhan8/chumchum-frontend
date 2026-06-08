import type { Dispatch, SetStateAction } from "react";
import type {
  EarningsSummary,
  PayoutMethod,
  PayoutMethodType,
  WithdrawalRequest,
} from "@/services/earnings.service";
import type { CreatorPayoutPreferences } from "@/services/payments.service";

export interface PaymentMethodUI extends PayoutMethod {
  displayName: string;
  isExpanded?: boolean;
}

export interface AddPayoutMethodInput {
  type: PayoutMethodType;
  name: string;
  accountDetails: string;
  bankName?: string;
}

export type MaskAccountDetails = (type: string, details: string) => string;

export interface WithdrawTabProps {
  earnings: EarningsSummary | null;
  payoutMethods: PaymentMethodUI[];
  withdrawals: WithdrawalRequest[];
  withdrawAmount: string;
  withdrawMethodId: string;
  isWithdrawing: boolean;
  isAddingMethod: boolean;
  showAddMethodDialog: boolean;
  onAddMethod: (methodData: AddPayoutMethodInput) => Promise<void>;
  onOpenAddMethodDialogChange: (open: boolean) => void;
  onWithdrawAmountChange: (amount: string) => void;
  onWithdrawMethodChange: (methodId: string) => void;
  onApplyQuickAmount: (ratio: number) => void;
  onRequestWithdrawal: () => Promise<void>;
  maskAccountDetails: MaskAccountDetails;
}

export interface PayoutMethodsTabProps {
  payoutMethods: PaymentMethodUI[];
  expandedMethods: Set<string>;
  isAddingMethod: boolean;
  showAddMethodDialog: boolean;
  onAddMethod: (methodData: AddPayoutMethodInput) => Promise<void>;
  onOpenAddMethodDialogChange: (open: boolean) => void;
  onToggleMethodExpanded: (id: string) => void;
  onSetDefault: (id: string) => Promise<void>;
  onDeleteMethod: (id: string) => Promise<void>;
  maskAccountDetails: MaskAccountDetails;
}

export interface SchedulePreferencesTabProps {
  payoutPreferences: CreatorPayoutPreferences;
  setPayoutPreferences: Dispatch<SetStateAction<CreatorPayoutPreferences>>;
  isSaving: boolean;
  onSavePreferences: () => Promise<void>;
}

