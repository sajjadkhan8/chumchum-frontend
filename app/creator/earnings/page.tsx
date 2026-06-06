"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Plus,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StatsCard } from "@/components/stats-card";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  earningsService,
  type EarningTransaction,
  type EarningsSummary,
  type PayoutMethod,
  type PayoutMethodType,
  type WithdrawalRequest,
} from "@/services/earnings.service";
import {
  paymentsService,
  type CreatorPayoutPreferences,
} from "@/services/payments.service";

type ActivityType = "earning" | "withdrawal" | "fee" | "refund";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  amount: number;
  status: string;
  date: Date;
}

const emptySummary: EarningsSummary = {
  totalEarned: 0,
  availableBalance: 0,
  pendingBalance: 0,
  totalWithdrawn: 0,
  platformFees: 0,
};

const defaultPayoutPreferences: CreatorPayoutPreferences = {
  autoWithdrawEnabled: false,
  payoutSchedule: "manual",
  minimumPayoutAmount: 5000,
  accountHolderName: "",
  ntnNumber: "",
  cnicLast4: "",
};

const payoutTypeLabels: Record<PayoutMethodType, string> = {
  STCPAY: "JazzCash (Mobile Wallet)",
  MADA: "Easypaisa (Mobile Wallet)",
  APPLEPAY: "SadaPay / NayaPay",
  BANK_TRANSFER: "Bank Transfer (IBAN)",
};

const toActivityType = (type: EarningTransaction["type"]): ActivityType => {
  if (type === "platform_fee") return "fee";
  if (type === "refund") return "refund";
  return type;
};

const fromTransaction = (tx: EarningTransaction): Activity => ({
  id: tx.id,
  type: toActivityType(tx.type),
  description: tx.description,
  amount: tx.amount,
  status: tx.status,
  date: new Date(tx.createdAt),
});

const fromWithdrawal = (withdrawal: WithdrawalRequest, method?: PayoutMethod): Activity => ({
  id: withdrawal.id,
  type: "withdrawal",
  description: `Withdrawal${method ? ` - ${method.name}` : ""}`,
  amount: -withdrawal.amount,
  status: withdrawal.status,
  date: new Date(withdrawal.createdAt),
});

const statusClass = (status: string) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "processing") return "bg-blue-100 text-blue-700";
  return "bg-yellow-100 text-yellow-700";
};

const getMethodTypeLabel = (method: PayoutMethod) => {
  const normalized = String(method.type).toUpperCase();
  if (normalized in payoutTypeLabels) {
    return payoutTypeLabels[normalized as PayoutMethodType];
  }
  return method.type.replaceAll("_", " ");
};

const validatePayoutDetails = (type: PayoutMethodType, details: string) => {
  const clean = details.trim();
  if (!clean) return "Account details are required";

  if (type === "BANK_TRANSFER" && !/^PK\d{2}[A-Z0-9]{20,30}$/i.test(clean)) {
    return "Use a valid Pakistani IBAN (example: PK36ABCD0123456789012345).";
  }

  if (type !== "BANK_TRANSFER" && !/^\+?\d{10,15}$/.test(clean.replaceAll("-", ""))) {
    return "Use a valid wallet number (10 to 15 digits).";
  }

  return null;
};

export default function CreatorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>(emptySummary);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [payoutPrefs, setPayoutPrefs] = useState<CreatorPayoutPreferences>(defaultPayoutPreferences);

  const [timeRange, setTimeRange] = useState("30");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PayoutMethodType>("BANK_TRANSFER");
  const [newMethodName, setNewMethodName] = useState("Bank Transfer");
  const [newMethodDetails, setNewMethodDetails] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, transactionsResponse, payoutResponse, withdrawalsResponse, payoutPrefsResponse] =
        await Promise.all([
          earningsService.getSummary(),
          earningsService.getTransactions(),
          earningsService.getPayoutMethods(),
          earningsService.getWithdrawals(),
          paymentsService.getCreatorPayoutPreferences(),
        ]);

      setSummary(summaryResponse);
      setTransactions(transactionsResponse);
      setPayoutMethods(payoutResponse);
      setWithdrawals(withdrawalsResponse);
      setPayoutPrefs(payoutPrefsResponse);
      setSelectedMethod(
        (current) => current || payoutResponse.find((method) => method.isDefault)?.id || payoutResponse[0]?.id || "",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load earnings";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEarnings();
  }, []);

  const methodMap = useMemo(
    () => Object.fromEntries(payoutMethods.map((method) => [method.id, method])),
    [payoutMethods],
  );

  const activities = useMemo(() => {
    const cutoff = Date.now() - Number(timeRange) * 24 * 60 * 60 * 1000;
    return [
      ...transactions.map(fromTransaction),
      ...withdrawals.map((withdrawal) => fromWithdrawal(withdrawal, methodMap[withdrawal.payoutMethodId])),
    ]
      .filter((activity) => activity.date.getTime() >= cutoff)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [methodMap, timeRange, transactions, withdrawals]);

  const earningActivities = activities.filter((activity) => activity.type === "earning" || activity.type === "refund");
  const withdrawalActivities = activities.filter((activity) => activity.type === "withdrawal" || activity.type === "fee");

  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((tx) => tx.type === "earning" && tx.status === "completed")
      .filter((tx) => {
        const date = new Date(tx.createdAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const previousMonth = useMemo(() => {
    const now = new Date();
    const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return transactions
      .filter((tx) => tx.type === "earning" && tx.status === "completed")
      .filter((tx) => {
        const date = new Date(tx.createdAt);
        return date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const monthlyChange = previousMonth > 0 ? ((thisMonth - previousMonth) / previousMonth) * 100 : 0;

  const handleCreatePayoutMethod = async () => {
    if (!newMethodName.trim()) {
      toast.error("Display name is required");
      return;
    }

    const detailsError = validatePayoutDetails(newMethodType, newMethodDetails);
    if (detailsError) {
      toast.error(detailsError);
      return;
    }

    setIsSavingMethod(true);
    try {
      const created = await earningsService.createPayoutMethod({
        type: newMethodType,
        name: newMethodName.trim(),
        accountDetails: newMethodDetails.trim(),
        isDefault: payoutMethods.length === 0,
      });
      setPayoutMethods((current) => [...current, created]);
      setSelectedMethod((current) => current || created.id);
      setNewMethodDetails("");
      setMethodDialogOpen(false);
      toast.success("Payout method added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add payout method";
      toast.error(message);
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleSetDefaultMethod = async (methodId: string) => {
    try {
      await earningsService.updatePayoutMethod(methodId, { isDefault: true });
      setPayoutMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === methodId })));
      toast.success("Default payout method updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update default payout method";
      toast.error(message);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    if (!window.confirm("Remove this payout method?")) return;

    try {
      await earningsService.deletePayoutMethod(methodId);
      setPayoutMethods((current) => {
        const next = current.filter((method) => method.id !== methodId);
        if (next.length > 0 && !next.some((method) => method.isDefault)) {
          next[0] = { ...next[0], isDefault: true };
        }
        return next;
      });
      if (selectedMethod === methodId) {
        const fallback = payoutMethods.find((method) => method.id !== methodId)?.id || "";
        setSelectedMethod(fallback);
      }
      toast.success("Payout method removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove payout method";
      toast.error(message);
    }
  };

  const handleWithdrawal = async () => {
    const amount = Number(withdrawAmount);

    if (!selectedMethod) {
      toast.error("Add a payout method before requesting a withdrawal");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid withdrawal amount");
      return;
    }
    if (amount < Math.max(1000, payoutPrefs.minimumPayoutAmount || 0)) {
      toast.error(`Minimum withdrawal is ${formatPrice(Math.max(1000, payoutPrefs.minimumPayoutAmount || 0))}`);
      return;
    }
    if (amount > summary.availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      await earningsService.requestWithdrawal({ payoutMethodId: selectedMethod, amount });
      setWithdrawAmount("");
      setWithdrawDialogOpen(false);
      toast.success("Withdrawal request submitted");
      await loadEarnings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to request withdrawal";
      toast.error(message);
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const handleSavePayoutPrefs = async () => {
    if (payoutPrefs.cnicLast4 && !/^\d{4}$/.test(payoutPrefs.cnicLast4)) {
      toast.error("CNIC last 4 digits must be exactly 4 numbers.");
      return;
    }

    setIsSavingPrefs(true);
    try {
      const saved = await paymentsService.updateCreatorPayoutPreferences({
        ...payoutPrefs,
        minimumPayoutAmount: Math.max(1000, payoutPrefs.minimumPayoutAmount || 1000),
      });
      setPayoutPrefs(saved);
      toast.success("Payout compliance profile updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update payout preferences";
      toast.error(message);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const renderActivities = (items: Activity[]) => (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((activity, index) => {
          const isCredit = activity.amount >= 0;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center justify-between rounded-lg border border-border/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isCredit ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {isCredit ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${isCredit ? "text-green-600" : "text-foreground"}`}>
                  {isCredit ? "+" : ""}
                  {formatPrice(Math.abs(activity.amount))}
                </p>
                <Badge variant="secondary" className={statusClass(activity.status)}>
                  {activity.status.replace("_", " ")}
                </Badge>
              </div>
            </motion.div>
          );
        })
      ) : (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No activity for this period.
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Earnings & Payouts</h1>
          <p className="text-muted-foreground">Manage income, withdrawals, payout methods, and compliance profile</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.info("Statement export will be connected to reports API.")}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Earnings" value={formatPrice(summary.totalEarned)} icon={DollarSign} />
        <StatsCard
          title="Available Balance"
          value={formatPrice(summary.availableBalance)}
          icon={Wallet}
          action={
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2 w-full" disabled={summary.availableBalance <= 0 || isLoading}>
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Transfers are processed within 1-3 business days for bank routes and near-instant for wallets.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                    <p className="text-xs text-muted-foreground">Available: {formatPrice(summary.availableBalance)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        {payoutMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name} ({method.accountDetails})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWithdrawDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleWithdrawal} disabled={isSubmittingWithdrawal}>
                    {isSubmittingWithdrawal ? "Submitting..." : "Submit Withdrawal"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <StatsCard title="Pending Balance" value={formatPrice(summary.pendingBalance)} icon={Clock} subtitle="In escrow or pending release" />
        <StatsCard
          title="This Month"
          value={formatPrice(thisMonth)}
          change={monthlyChange}
          icon={TrendingUp}
          trend={monthlyChange >= 0 ? "up" : "down"}
        />
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="payout-methods">Payout Methods</TabsTrigger>
          <TabsTrigger value="compliance">Compliance & Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                </TabsList>
                <TabsContent value="all">{renderActivities(activities)}</TabsContent>
                <TabsContent value="earnings">{renderActivities(earningActivities)}</TabsContent>
                <TabsContent value="withdrawals">{renderActivities(withdrawalActivities)}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing SLAs</CardTitle>
              <CardDescription>Expected payout timelines in Pakistan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="font-medium">JazzCash / Easypaisa / SadaPay</p>
                <p className="text-muted-foreground">Typically within minutes after approval.</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="font-medium">Bank Transfer (IBAN)</p>
                <p className="text-muted-foreground">Usually 1-3 business days depending on bank rails.</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Compliance hold notice
                </div>
                Missing tax details or KYC checks can delay withdrawals.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout-methods">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payout Methods</CardTitle>
                <CardDescription>Add multiple methods and set a default payout destination</CardDescription>
              </div>
              <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Method
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add payout method</DialogTitle>
                    <DialogDescription>
                      Add a secure destination for creator withdrawals.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newMethodType}
                        onValueChange={(value) => {
                          const nextType = value as PayoutMethodType;
                          setNewMethodType(nextType);
                          setNewMethodName(payoutTypeLabels[nextType]);
                          setNewMethodDetails("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(payoutTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-name">Display name</Label>
                      <Input id="payout-name" value={newMethodName} onChange={(event) => setNewMethodName(event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payout-details">Account details</Label>
                      <Input
                        id="payout-details"
                        value={newMethodDetails}
                        onChange={(event) => setNewMethodDetails(event.target.value)}
                        placeholder={newMethodType === "BANK_TRANSFER" ? "PK36ABCD0123456789012345" : "+923001234567"}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setMethodDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePayoutMethod} disabled={isSavingMethod}>
                      {isSavingMethod ? "Saving..." : "Save Method"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-3">
              {payoutMethods.length > 0 ? (
                payoutMethods.map((method) => (
                  <div key={method.id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          {String(method.type).toLowerCase() === "bank_transfer" ? (
                            <Building2 className="h-5 w-5" />
                          ) : (
                            <Wallet className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{getMethodTypeLabel(method)} - {method.accountDetails}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            Default
                          </Badge>
                        )}
                        {!method.isDefault && (
                          <Button variant="outline" size="sm" onClick={() => void handleSetDefaultMethod(method.id)}>
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => void handleDeleteMethod(method.id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Add a payout method to request withdrawals.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Profile</CardTitle>
              <CardDescription>Tax and identity signals used for payout risk controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account holder name</Label>
                <Input
                  id="accountHolderName"
                  value={payoutPrefs.accountHolderName}
                  onChange={(event) => setPayoutPrefs((current) => ({ ...current, accountHolderName: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ntnNumber">NTN (optional)</Label>
                  <Input
                    id="ntnNumber"
                    value={payoutPrefs.ntnNumber}
                    onChange={(event) => setPayoutPrefs((current) => ({ ...current, ntnNumber: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnicLast4">CNIC last 4 digits</Label>
                  <Input
                    id="cnicLast4"
                    maxLength={4}
                    value={payoutPrefs.cnicLast4}
                    onChange={(event) =>
                      setPayoutPrefs((current) => ({ ...current, cnicLast4: event.target.value.replace(/\D/g, "") }))
                    }
                  />
                </div>
              </div>

              <Button onClick={() => void handleSavePayoutPrefs()} disabled={isSavingPrefs}>
                {isSavingPrefs ? "Saving..." : "Save Compliance Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payout Controls</CardTitle>
              <CardDescription>Configure transfer thresholds and frequency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Automatic withdrawals</p>
                  <p className="text-sm text-muted-foreground">Auto-transfer funds on your payout schedule.</p>
                </div>
                <Switch
                  checked={payoutPrefs.autoWithdrawEnabled}
                  onCheckedChange={(checked) => setPayoutPrefs((current) => ({ ...current, autoWithdrawEnabled: checked }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Payout schedule</Label>
                  <Select
                    value={payoutPrefs.payoutSchedule}
                    onValueChange={(value) =>
                      setPayoutPrefs((current) => ({ ...current, payoutSchedule: value as CreatorPayoutPreferences["payoutSchedule"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minimum payout amount (PKR)</Label>
                  <Input
                    type="number"
                    min={1000}
                    value={payoutPrefs.minimumPayoutAmount}
                    onChange={(event) =>
                      setPayoutPrefs((current) => ({
                        ...current,
                        minimumPayoutAmount: Number(event.target.value) || 1000,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Account trust status
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Withdrawals enabled for your account
                </div>
              </div>

              <Button variant="outline" onClick={() => void handleSavePayoutPrefs()} disabled={isSavingPrefs}>
                {isSavingPrefs ? "Saving..." : "Save Payout Controls"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
