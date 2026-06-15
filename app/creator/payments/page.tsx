"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, Clock3, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const bankNameByMethodIdRef = useRef<Record<string, string>>({});

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
          bankName: method.bankName ?? bankNameByMethodIdRef.current[method.id],
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

      if (methodData.bankName) {
        bankNameByMethodIdRef.current[createdMethod.id] = methodData.bankName;
      }

      // Optimistically retain bankName for immediate logo display even if the API
      // response/backend has not started returning the optional field yet.
      setPayoutMethods((current) => [
        ...current,
        {
          ...createdMethod,
          bankName: createdMethod.bankName ?? methodData.bankName,
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
        <div className="mx-auto max-w-6xl rounded-[1.6rem] border border-[#dce3dc] bg-white px-6 py-16 text-center shadow-[0_18px_55px_rgba(38,70,50,0.07)]">
          <p className="text-sm font-bold text-[#69766e]">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-24 pt-2 text-[#173b2a] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px]">
        <section className="overflow-hidden rounded-[1.8rem] bg-[#173b2a] p-5 text-white sm:p-7 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#f0c56e]">
                <ShieldCheck className="size-3.5" /> Secure payments hub
              </span>
              <p className="mt-7 text-xs font-bold text-[#a9c4b3]">Your money, clearly managed</p>
              <h1 className="mt-2 max-w-3xl text-[clamp(2.3rem,5vw,4.6rem)] font-extrabold leading-[0.98] tracking-[-0.06em] text-white">
                Move earnings with confidence.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#c9dace]">
                Withdraw your available balance, manage trusted payout methods, and keep every payment preference in one calm place.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-[1.3rem] border border-white/12 bg-[#214b36] p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f0c56e]">Available</p>
                  <Wallet className="size-4 text-[#f0c56e]" />
                </div>
                <p className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-white">{formatPrice(earnings?.availableBalance || 0)}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#a9c4b3]">Ready to withdraw</p>
              </div>
              <div className="rounded-[1.3rem] border border-white/12 bg-white/8 p-4">
                <div className="flex items-start justify-between">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#f0c56e]">Pending</p>
                  <Clock3 className="size-4 text-[#f0c56e]" />
                </div>
                <p className="mt-5 text-2xl font-extrabold tracking-[-0.04em] text-white">{formatPrice(earnings?.pendingBalance || 0)}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#a9c4b3]">Awaiting clearance</p>
              </div>
            </div>
          </div>
        </section>

      <Tabs value={activeTab} onValueChange={updateTabInUrl} className="mt-5 space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-[1.25rem] border border-[#dce3dc] bg-[#f4f2e9] p-1">
          <TabsTrigger value="withdraw" className="min-h-11 gap-2 rounded-xl px-2 text-xs font-extrabold text-[#69766e] data-[state=active]:bg-[#185c39] data-[state=active]:text-white"><ArrowDownToLine className="size-4" /> <span className="hidden sm:inline">Withdraw</span></TabsTrigger>
          <TabsTrigger value="methods" className="min-h-11 gap-2 rounded-xl px-2 text-xs font-extrabold text-[#69766e] data-[state=active]:bg-[#185c39] data-[state=active]:text-white"><CreditCard className="size-4" /> <span className="hidden sm:inline">Payout Methods</span><span className="sm:hidden">Methods</span></TabsTrigger>
          <TabsTrigger value="schedule" className="min-h-11 gap-2 rounded-xl px-2 text-xs font-extrabold text-[#69766e] data-[state=active]:bg-[#185c39] data-[state=active]:text-white"><Clock3 className="size-4" /> <span className="hidden sm:inline">Schedule & Preferences</span><span className="sm:hidden">Preferences</span></TabsTrigger>
        </TabsList>

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
      </Tabs>
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
