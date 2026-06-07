"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Check,
  Trash2,
  Info,
  ChevronDown,
  Copy,
  CreditCard,
  ArrowUp,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  earningsService,
  type EarningsSummary,
  type PayoutMethod,
  type PayoutMethodType,
  type WithdrawalRequest,
} from "@/services/earnings.service";
import {
  paymentsService,
  type CreatorPayoutPreferences,
} from "@/services/payments.service";

const PAYOUT_METHOD_ICONS: Record<string, string> = {
  JAZZCASH: "📱",
  STCPAY: "📱",
  MADA: "📱",
  EASYPAISA: "📱",
  SADAPAY: "📱",
  NAYAPAY: "📱",
  BANK_TRANSFER: "🏦",
  APPLEPAY: "📱",
};

const PAYOUT_METHOD_LABELS: Record<string, string> = {
  JAZZCASH: "JazzCash",
  STCPAY: "STC Pay",
  MADA: "Mada",
  EASYPAISA: "Easypaisa",
  SADAPAY: "SadaPay",
  NAYAPAY: "NayaPay",
  BANK_TRANSFER: "Bank Transfer (IBFT)",
  APPLEPAY: "Apple Pay",
};

interface PaymentMethodUI extends PayoutMethod {
  displayName: string;
  icon: string;
  icon_emoji?: string;
  isExpanded?: boolean;
}

const validatePayoutDetails = (type: string, details: string) => {
  const clean = details.trim();
  if (!clean) return "Account details are required";

  const normalizedType = String(type).toUpperCase();
  if (normalizedType === "BANK_TRANSFER" && !/^PK\d{2}[A-Z0-9]{20,30}$/i.test(clean)) {
    return "Use a valid Pakistani IBAN (example: PK36ABCD0123456789012345).";
  }

  if (
    normalizedType !== "BANK_TRANSFER" &&
    !/^\+?\d{10,15}$/.test(clean.replaceAll("-", ""))
  ) {
    return "Use a valid wallet number (10 to 15 digits).";
  }

  return null;
};

const maskAccountDetails = (type: string, details: string) => {
  const normalizedType = String(type).toUpperCase();
  if (normalizedType === "BANK_TRANSFER") {
    return `${details.slice(0, 6)}...${details.slice(-4)}`;
  }
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
    });
   const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [newMethodType, setNewMethodType] = useState<PayoutMethodType>(
    "BANK_TRANSFER"
  );
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodDetails, setNewMethodDetails] = useState("");
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("withdraw");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethodId, setWithdrawMethodId] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Load all data
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

      const enrichedMethods: PaymentMethodUI[] = methods.map((method) => ({
        ...method,
        displayName: PAYOUT_METHOD_LABELS[String(method.type).toUpperCase()] || method.name,
        icon: PAYOUT_METHOD_ICONS[String(method.type).toUpperCase()] || "💳",
      }));
      setPayoutMethods(enrichedMethods);

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
    const allowedTabs = new Set(["withdraw", "methods", "schedule"]);
    setActiveTab(tab && allowedTabs.has(tab) ? tab : "withdraw");
  }, [searchParams]);

  useEffect(() => {
    setWithdrawMethodId((current) => {
      if (current && payoutMethods.some((method) => method.id === current)) return current;
      return payoutMethods.find((method) => method.isDefault)?.id || payoutMethods[0]?.id || "";
    });
  }, [payoutMethods]);

  const handleAddMethod = async () => {
    const validation = validatePayoutDetails(newMethodType, newMethodDetails);
    if (validation) {
      toast.error(validation);
      return;
    }

    setIsAddingMethod(true);
    try {
      await earningsService.createPayoutMethod({
        type: newMethodType,
        name: editingMethod ? newMethodName : PAYOUT_METHOD_LABELS[newMethodType],
        accountDetails: newMethodDetails,
        isDefault: payoutMethods.length === 0,
      });

      toast.success(
        editingMethod
          ? "Payout method updated"
          : "Payout method added successfully"
      );

      setShowAddMethodDialog(false);
      resetMethodForm();
      await loadPaymentsData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add payout method";
      toast.error(message);
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
      const method = payoutMethods.find((m) => m.id === id);
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

  const resetMethodForm = () => {
    setNewMethodType("BANK_TRANSFER");
    setNewMethodName("");
    setNewMethodDetails("");
    setEditingMethod(null);
  };

  const toggleMethodExpanded = (id: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMethods(newExpanded);
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
      <div className="container mx-auto max-w-4xl p-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 pb-24 md:p-6 md:pb-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Payments
        </h1>
        <p className="text-muted-foreground">
          Manage withdrawals, payout methods, schedule, and compliance controls
        </p>
      </div>


      {/* Earnings Overview */}
      {earnings && (
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-base">Withdrawal Console</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Available to Withdraw</p>
                <p className="mt-1 text-2xl font-semibold text-green-600">{formatPrice(earnings.availableBalance)}</p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Pending Clearance</p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">{formatPrice(earnings.pendingBalance)}</p>
              </div>
              <div className="rounded-lg bg-background/50 p-3">
                <p className="text-sm text-muted-foreground">Suggested Next Step</p>
                <p className="mt-1 text-sm font-medium">Keep at least one verified payout method set as default.</p>
              </div>
            </div>
            {/* Top-level withdraw CTA is intentionally removed; withdraw actions live in the Withdraw tab. */}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={updateTabInUrl} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="methods">Payout Methods</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Console</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="mt-1 text-xl font-semibold text-green-600">
                    {formatPrice(earnings?.availableBalance || 0)}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Minimum Withdrawal</p>
                  <p className="mt-1 text-xl font-semibold">{formatPrice(1000)}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                  <p className="mt-1 text-sm font-medium">Wallet: near-instant · Bank: 1-3 business days</p>
                </div>
              </div>

              {payoutMethods.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-center">
                  <p className="font-medium">Add a payout method to withdraw funds</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect JazzCash, Easypaisa, SadaPay, NayaPay, or a bank account first.
                  </p>
                  <Button className="mt-4" onClick={() => updateTabInUrl("methods") }>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payout Method
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount (PKR)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        min="1000"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(event) => setWithdrawAmount(event.target.value)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => applyQuickAmount(0.25)}>25%</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyQuickAmount(0.5)}>50%</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => applyQuickAmount(1)}>100%</Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Payout Method</Label>
                      <Select value={withdrawMethodId} onValueChange={setWithdrawMethodId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payout method" />
                        </SelectTrigger>
                        <SelectContent>
                          {payoutMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.displayName} ({maskAccountDetails(method.type, method.accountDetails)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    <p className="text-sm font-medium">Review</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Requested amount</span>
                      <span className="font-medium">{formatPrice(Number(withdrawAmount) || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Destination</span>
                      <span className="font-medium">
                        {payoutMethods.find((method) => method.id === withdrawMethodId)?.displayName || "Select method"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available after request</span>
                      <span className="font-medium">
                        {formatPrice(Math.max(0, (earnings?.availableBalance || 0) - (Number(withdrawAmount) || 0)))}
                      </span>
                    </div>
                    <Button className="mt-2 w-full" onClick={handleRequestWithdrawal} disabled={isWithdrawing || (earnings?.availableBalance || 0) <= 0}>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      {isWithdrawing ? "Submitting..." : "Request Withdrawal"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Withdrawals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {withdrawals.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No withdrawals requested yet.
                </div>
              ) : (
                withdrawals.map((withdrawal) => {
                  const method = payoutMethods.find((item) => item.id === withdrawal.payoutMethodId);
                  return (
                    <div key={withdrawal.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{method?.displayName || "Payout method"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(new Date(withdrawal.createdAt))}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(withdrawal.amount)}</p>
                        <Badge variant="secondary" className="capitalize">{withdrawal.status}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          {/* Connected Methods */}
          {payoutMethods.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Connected Methods</CardTitle>
                <Dialog
                  open={showAddMethodDialog}
                  onOpenChange={setShowAddMethodDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => resetMethodForm()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Payout Method</DialogTitle>
                      <DialogDescription>
                        Add a new payout method to receive your earnings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Payment Method Type</Label>
                        <Select
                          value={newMethodType}
                          onValueChange={(v) =>
                            setNewMethodType(v as PayoutMethodType)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JAZZCASH">
                              {PAYOUT_METHOD_ICONS.JAZZCASH} JazzCash
                            </SelectItem>
                            <SelectItem value="EASYPAISA">
                              {PAYOUT_METHOD_ICONS.EASYPAISA} Easypaisa
                            </SelectItem>
                            <SelectItem value="SADAPAY">
                              {PAYOUT_METHOD_ICONS.SADAPAY} SadaPay
                            </SelectItem>
                            <SelectItem value="NAYAPAY">
                              {PAYOUT_METHOD_ICONS.NAYAPAY} NayaPay
                            </SelectItem>
                            <SelectItem value="BANK_TRANSFER">
                              {PAYOUT_METHOD_ICONS.BANK_TRANSFER} Bank Transfer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {String(newMethodType).toUpperCase() ===
                          "BANK_TRANSFER"
                            ? "Account Holder Name"
                            : "Account Holder Name"}
                        </Label>
                        <Input
                          placeholder="Full name"
                          value={newMethodName}
                          onChange={(e) => setNewMethodName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          {String(newMethodType).toUpperCase() ===
                          "BANK_TRANSFER"
                            ? "IBAN"
                            : "Account/Mobile Number"}
                        </Label>
                        <Input
                          placeholder={
                            String(newMethodType).toUpperCase() ===
                            "BANK_TRANSFER"
                              ? "PK36ABCD0123456789012345"
                              : "03001234567"
                          }
                          value={newMethodDetails}
                          onChange={(e) => setNewMethodDetails(e.target.value)}
                        />
                      </div>
                      {String(newMethodType).toUpperCase() ===
                        "BANK_TRANSFER" && (
                        <div className="space-y-2">
                          <Label>Bank Name</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="meezan">Meezan Bank</SelectItem>
                              <SelectItem value="hbl">HBL</SelectItem>
                              <SelectItem value="ubl">UBL</SelectItem>
                              <SelectItem value="mcb">MCB</SelectItem>
                              <SelectItem value="alfalah">
                                Bank Alfalah
                              </SelectItem>
                              <SelectItem value="nbp">NBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMethodDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddMethod}
                        disabled={isAddingMethod}
                      >
                        {isAddingMethod ? "Adding..." : "Add Method"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {payoutMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`cursor-pointer rounded-lg border transition-all ${
                      expandedMethods.has(method.id)
                        ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/20"
                        : "border-border hover:border-border/80"
                    }`}
                    onClick={() => toggleMethodExpanded(method.id)}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{method.displayName}</p>
                          {method.isDefault && (
                            <Badge variant="default" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {maskAccountDetails(
                            method.type,
                            method.accountDetails
                          )}{" "}
                          · Instant payout
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {expandedMethods.has(method.id) ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedMethods.has(method.id) && (
                      <div className="space-y-3 border-t border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Account Holder
                            </p>
                            <p className="font-medium">
                              {method.name || "Not specified"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {String(method.type).toUpperCase() ===
                              "BANK_TRANSFER"
                                ? "IBAN"
                                : "Account Details"}
                            </p>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-background px-2 py-1 text-xs font-mono">
                                {method.accountDetails}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    method.accountDetails
                                  );
                                  toast.success("Copied to clipboard");
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!method.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetDefault(method.id);
                              }}
                            >
                              Set as Default
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMethod(method.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Add First Method */}
          {payoutMethods.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold">No payout methods added yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Add your first payout method to start receiving earnings
                  </p>
                  <Dialog
                    open={showAddMethodDialog}
                    onOpenChange={setShowAddMethodDialog}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={() => resetMethodForm()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Payout Method
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Payout Method</DialogTitle>
                        <DialogDescription>
                          Add a payout method to receive your earnings
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Payment Method Type</Label>
                          <Select
                            value={newMethodType}
                            onValueChange={(v) =>
                              setNewMethodType(v as PayoutMethodType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="JAZZCASH">
                                {PAYOUT_METHOD_ICONS.JAZZCASH} JazzCash
                              </SelectItem>
                              <SelectItem value="EASYPAISA">
                                {PAYOUT_METHOD_ICONS.EASYPAISA} Easypaisa
                              </SelectItem>
                              <SelectItem value="SADAPAY">
                                {PAYOUT_METHOD_ICONS.SADAPAY} SadaPay
                              </SelectItem>
                              <SelectItem value="NAYAPAY">
                                {PAYOUT_METHOD_ICONS.NAYAPAY} NayaPay
                              </SelectItem>
                              <SelectItem value="BANK_TRANSFER">
                                {PAYOUT_METHOD_ICONS.BANK_TRANSFER} Bank Transfer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Account Holder Name</Label>
                          <Input
                            placeholder="Full name"
                            value={newMethodName}
                            onChange={(e) => setNewMethodName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {String(newMethodType).toUpperCase() ===
                            "BANK_TRANSFER"
                              ? "IBAN"
                              : "Account/Mobile Number"}
                          </Label>
                          <Input
                            placeholder={
                              String(newMethodType).toUpperCase() ===
                              "BANK_TRANSFER"
                                ? "PK36ABCD0123456789012345"
                                : "03001234567"
                            }
                            value={newMethodDetails}
                            onChange={(e) =>
                              setNewMethodDetails(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddMethodDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddMethod}
                          disabled={isAddingMethod}
                        >
                          {isAddingMethod ? "Adding..." : "Add Method"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schedule & Preferences Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Withdrawal Schedule</Label>
                  <Select
                    value={payoutPreferences.payoutSchedule}
                    onValueChange={(v) =>
                      setPayoutPreferences((p) => ({
                        ...p,
                        payoutSchedule: v as any,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">
                        Manual — withdraw anytime
                      </SelectItem>
                      <SelectItem value="weekly">Weekly — every Monday</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly — 1st of month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Payout Threshold (PKR)</Label>
                  <Select
                    value={String(payoutPreferences.minimumPayoutAmount)}
                    onValueChange={(v) =>
                      setPayoutPreferences((p) => ({
                        ...p,
                        minimumPayoutAmount: Number(v),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1000">PKR 1,000</SelectItem>
                      <SelectItem value="2500">PKR 2,500</SelectItem>
                      <SelectItem value="5000">PKR 5,000</SelectItem>
                      <SelectItem value="10000">PKR 10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax & Compliance (FBR)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>CNIC Number</Label>
                  <Input
                    placeholder="35201-1234567-1"
                    value={payoutPreferences.cnicLast4}
                    onChange={(e) =>
                      setPayoutPreferences((p) => ({
                        ...p,
                        cnicLast4: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    maxLength={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>NTN (Optional)</Label>
                  <Input
                    placeholder="For filer status"
                    value={payoutPreferences.ntnNumber}
                    onChange={(e) =>
                      setPayoutPreferences((p) => ({
                        ...p,
                        ntnNumber: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  Per FBR rules, WHT is deducted at source. Filers: 10% ·
                  Non-filers: 15%. Add your NTN to confirm filer status and save
                  5%.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Instant withdrawal</p>
                  <p className="text-sm text-muted-foreground">
                    Use mobile wallet for immediate transfers (daily limits apply)
                  </p>
                </div>
                <Switch
                  checked={payoutPreferences.autoWithdrawEnabled}
                  onCheckedChange={(checked) =>
                    setPayoutPreferences((p) => ({
                      ...p,
                      autoWithdrawEnabled: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Earnings notifications</p>
                  <p className="text-sm text-muted-foreground">
                    SMS + push when a payment clears into your balance
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Weekly earnings digest</p>
                  <p className="text-sm text-muted-foreground">
                    Email summary every Sunday with your week's earnings
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSavePreferences} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : <>
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </>}
          </Button>
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

