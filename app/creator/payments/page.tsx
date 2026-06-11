"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Payments
        </h1>
        <p className="text-muted-foreground">
          Manage withdrawals, payout methods, schedule, and compliance controls
        </p>
      </div>

      {earnings && (
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Withdrawal Console</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {formatPrice(earnings.availableBalance)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Pending Clearance</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">
                  {formatPrice(earnings.pendingBalance)}
                </p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Suggested Next Step</p>
                <p className="mt-1 text-sm font-medium">
                  Keep at least one verified payout method set as default.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={updateTabInUrl} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="methods">Payout Methods</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Preferences</TabsTrigger>
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
  );
}

export default function CreatorPaymentsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreatorPaymentsContent />
    </Suspense>
  );
}
