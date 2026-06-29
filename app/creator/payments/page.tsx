"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, CheckCircle2, Clock3, CreditCard, TrendingUp, Wallet } from "lucide-react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { CreatorMetricCard } from "@/components/creator-metric-card";
import { TabsContent } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/utils";
import {
  earningsService,
  type EarningsSummary,
  type WithdrawalRequest,
} from "@/services/earnings.service";
import {
  paymentsService,
  type CreatorPayoutPreferences,
} from "@/services/payments.service";
import { PayoutMethodsTab } from "./_components/payout-methods-tab";
import { SchedulePreferencesTab } from "./_components/schedule-preferences-tab";
import type { AddPayoutMethodInput, PaymentMethodUI } from "./_components/types";
import { WithdrawTab } from "./_components/withdraw-tab";

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
  BANK_TRANSFER: "Bank Transfer (IBFT)",
};

const VALID_TABS = new Set(["withdraw", "methods", "schedule"]);

const getPayoutMethodDisplayName = (method: { type: string; name: string }) =>
  PAYOUT_METHOD_LABELS[String(method.type).toUpperCase()] || method.name;

const maskAccountDetails = (type: string, details: string) => {
  const normalizedType = String(type).toUpperCase();

  if (!details) return "••••";

  if (normalizedType === "BANK_TRANSFER") {
    if (details.length <= 10) return details;
    return `${details.slice(0, 6)}...${details.slice(-4)}`;
  }

  if (details.length <= 7) return details;
  return `${details.slice(0, 3)}...${details.slice(-4)}`;
};

function CreatorPaymentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PaymentMethodUI[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutPreferences, setPayoutPreferences] =
    useState<CreatorPayoutPreferences>({
      autoWithdrawEnabled: false,
      payoutSchedule: "manual",
      minimumPayoutAmount: 5000,
      accountHolderName: "",
      ntnNumber: "",
      cnicLast4: "",
      earningsNotificationsEnabled: true,
      weeklyDigestEnabled: false,
    });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("withdraw");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethodId, setWithdrawMethodId] = useState("");

  const loadPaymentsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summary, methods, preferences, recentWithdrawals] = await Promise.all([
        earningsService.getSummary(),
        earningsService.getPayoutMethods(),
        paymentsService.getCreatorPayoutPreferences(),
        earningsService.getWithdrawals(0, 6),
      ]);

      setEarnings(summary);
      setPayoutPreferences(preferences);
      setWithdrawals(recentWithdrawals);
      setPayoutMethods(
        methods.map((method) => ({
          ...method,
          displayName: getPayoutMethodDisplayName(method),
        }))
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load payment data";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    setActiveTab(tab && VALID_TABS.has(tab) ? tab : "withdraw");
  }, [searchParams]);

  useEffect(() => {
    setWithdrawMethodId((current) => {
      if (current && payoutMethods.some((method) => method.id === current)) {
        return current;
      }

      return (
        payoutMethods.find((method) => method.isDefault)?.id ||
        payoutMethods[0]?.id ||
        ""
      );
    });
  }, [payoutMethods]);

  const handleAddMethod = async (methodData: AddPayoutMethodInput) => {
    setIsAddingMethod(true);
    try {
      const createdMethod = await earningsService.createPayoutMethod({
        type: methodData.type,
        name: methodData.name,
        accountDetails: methodData.accountDetails,
        bankName: methodData.bankName,
        isDefault: payoutMethods.length === 0,
      });

      toast.success("Payout method added successfully");
      setShowAddMethodDialog(false);

      setPayoutMethods((current) => [
        ...current,
        {
          ...createdMethod,
          displayName: getPayoutMethodDisplayName(createdMethod),
        },
      ]);

      await loadPaymentsData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add payout method";
      toast.error(message);
      throw error;
    } finally {
      setIsAddingMethod(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payout method?")) return;

    try {
      await earningsService.deletePayoutMethod(id);
      toast.success("Payout method deleted");
      await loadPaymentsData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete payout method";
      toast.error(message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const method = payoutMethods.find((item) => item.id === id);
      if (!method) return;

      await earningsService.updatePayoutMethod(id, {
        isDefault: true,
      });

      toast.success("Default payout method updated");
      await loadPaymentsData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update default method";
      toast.error(message);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await paymentsService.updateCreatorPayoutPreferences(payoutPreferences);
      toast.success("Payout preferences saved");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save preferences";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMethodExpanded = (id: string) => {
    setExpandedMethods((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const updateTabInUrl = (nextTab: string) => {
    setActiveTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());

    if (nextTab === "withdraw") {
      params.delete("tab");
    } else {
      params.set("tab", nextTab);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const applyQuickAmount = (ratio: number) => {
    const available = earnings?.availableBalance || 0;

    if (available <= 0) {
      setWithdrawAmount("");
      return;
    }

    const amount = Math.floor(available * ratio);
    setWithdrawAmount(String(Math.max(1000, amount)));
  };

  const handleRequestWithdrawal = async () => {
    const available = earnings?.availableBalance || 0;
    const amount = Number(withdrawAmount);

    if (!withdrawMethodId) {
      toast.error("Add and select a payout method first");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }
    if (amount < 1000) {
      toast.error(`Minimum withdrawal is ${formatPrice(1000)}`);
      return;
    }
    if (amount > available) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setIsWithdrawing(true);
    try {
      await earningsService.requestWithdrawal({
        amount,
        payoutMethodId: withdrawMethodId,
      });
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      await loadPaymentsData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to request withdrawal";
      toast.error(message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#fbfaf5] px-4 py-8">
        <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-[#d1ddd6] bg-white px-6 py-16 text-center shadow-[0_18px_55px_rgba(38,70,50,0.07)]">
          <p className="text-sm font-bold text-[#6b7870]">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-24 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px]">
        {/* ── Page header ── */}
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Earnings</p>
          <h1 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#1e3d2e]">Payments</h1>
        </div>

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <CreatorMetricCard dark title="Available" value={formatPrice(earnings?.availableBalance || 0)} sub="ready to withdraw" Icon={Wallet} />
          <CreatorMetricCard title="Awaiting approval" value={formatPrice(earnings?.awaitingApprovalNet || 0)} sub={`${formatPrice(earnings?.awaitingApprovalGross || 0)} submitted`} Icon={CheckCircle2} />
          <CreatorMetricCard title="Processing" value={formatPrice(earnings?.pendingBalance || 0)} sub="withdrawals in flight" Icon={Clock3} />
          <CreatorMetricCard title="Total Earned" value={formatPrice(earnings?.totalEarned || 0)} sub="lifetime creator earnings" Icon={TrendingUp} />
          <CreatorMetricCard gold title="Withdrawn" value={formatPrice(earnings?.totalWithdrawn || 0)} sub="paid out so far" Icon={ArrowDownToLine} />
        </div>

      <TabsPrimitive.Root value={activeTab} onValueChange={updateTabInUrl} className="mt-5 space-y-5">
        <TabsPrimitive.List className="grid w-full grid-cols-3 rounded-xl bg-[#e8ede9] p-1 gap-1">
          <TabsPrimitive.Trigger value="withdraw" className="flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"><ArrowDownToLine className="size-4" /> <span className="hidden sm:inline">Withdraw</span></TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="methods" className="flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"><CreditCard className="size-4" /> <span className="hidden sm:inline">Payout Methods</span><span className="sm:hidden">Methods</span></TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger value="schedule" className="flex h-9 items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold text-[#6b7c72] transition-all duration-200 hover:text-[#2e5440] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"><Clock3 className="size-4" /> <span className="hidden sm:inline">Schedule & Preferences</span><span className="sm:hidden">Preferences</span></TabsPrimitive.Trigger>
        </TabsPrimitive.List>

        <TabsContent value="withdraw" className="space-y-4">
          <WithdrawTab
            earnings={earnings}
            payoutMethods={payoutMethods}
            withdrawals={withdrawals}
            withdrawAmount={withdrawAmount}
            withdrawMethodId={withdrawMethodId}
            isWithdrawing={isWithdrawing}
            isAddingMethod={isAddingMethod}
            showAddMethodDialog={showAddMethodDialog}
            onAddMethod={handleAddMethod}
            onOpenAddMethodDialogChange={setShowAddMethodDialog}
            onWithdrawAmountChange={setWithdrawAmount}
            onWithdrawMethodChange={setWithdrawMethodId}
            onApplyQuickAmount={applyQuickAmount}
            onRequestWithdrawal={handleRequestWithdrawal}
            maskAccountDetails={maskAccountDetails}
          />
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <PayoutMethodsTab
            payoutMethods={payoutMethods}
            expandedMethods={expandedMethods}
            isAddingMethod={isAddingMethod}
            showAddMethodDialog={showAddMethodDialog}
            onAddMethod={handleAddMethod}
            onOpenAddMethodDialogChange={setShowAddMethodDialog}
            onToggleMethodExpanded={toggleMethodExpanded}
            onSetDefault={handleSetDefault}
            onDeleteMethod={handleDeleteMethod}
            maskAccountDetails={maskAccountDetails}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <SchedulePreferencesTab
            payoutPreferences={payoutPreferences}
            setPayoutPreferences={setPayoutPreferences}
            isSaving={isSaving}
            onSavePreferences={handleSavePreferences}
          />
        </TabsContent>
      </TabsPrimitive.Root>
      </div>
    </div>
  );
}

export default function CreatorPaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorPaymentsContent />
    </Suspense>
  );
}
