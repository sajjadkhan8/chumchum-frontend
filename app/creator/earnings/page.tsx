"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Building2,
  Wallet,
  Clock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/stats-card";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  earningsService,
  type EarningTransaction,
  type EarningsSummary,
  type PayoutMethod,
  type PayoutMethodType,
  type WithdrawalRequest,
} from "@/services/earnings.service";

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

const payoutTypeLabels: Record<PayoutMethodType, string> = {
  STCPAY: "STC Pay",
  MADA: "Mada",
  APPLEPAY: "Apple Pay",
  BANK_TRANSFER: "Bank Transfer",
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
  description: `Withdrawal request${method ? ` - ${method.name}` : ""}`,
  amount: -withdrawal.amount,
  status: withdrawal.status,
  date: new Date(withdrawal.createdAt),
});

const statusClass = (status: string) => {
  if (status === "completed") return "bg-green-100 text-green-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

export default function CreatorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>(emptySummary);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [timeRange, setTimeRange] = useState("30");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PayoutMethodType>("BANK_TRANSFER");
  const [newMethodName, setNewMethodName] = useState("Bank Transfer");
  const [newMethodDetails, setNewMethodDetails] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [isSavingMethod, setIsSavingMethod] = useState(false);

  const loadEarnings = async () => {
    setIsLoading(true);
    try {
      const [summaryResponse, transactionsResponse, payoutResponse, withdrawalsResponse] = await Promise.all([
        earningsService.getSummary(),
        earningsService.getTransactions(),
        earningsService.getPayoutMethods(),
        earningsService.getWithdrawals(),
      ]);
      setSummary(summaryResponse);
      setTransactions(transactionsResponse);
      setPayoutMethods(payoutResponse);
      setWithdrawals(withdrawalsResponse);
      setSelectedMethod((current) => current || payoutResponse.find((method) => method.isDefault)?.id || payoutResponse[0]?.id || "");
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
    if (!newMethodName.trim() || !newMethodDetails.trim()) {
      toast.error("Payout method name and account details are required");
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
      setPayoutDialogOpen(false);
      toast.success("Payout method added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add payout method";
      toast.error(message);
    } finally {
      setIsSavingMethod(false);
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

  const renderActivities = (items: Activity[]) => (
    <div className="space-y-3">
      {items.length > 0 ? (
        items.map((activity, index) => {
          const isCredit = activity.amount >= 0;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Earnings</h1>
          <p className="text-muted-foreground">Track your income and manage withdrawals</p>
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
          <Button variant="outline" onClick={() => toast.info("Export will be added with reporting.")}>
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
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount">Amount (PKR)</Label>
                    <Input
                      id="withdraw-amount"
                      type="number"
                      min="1"
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
                    {isSubmittingWithdrawal ? "Submitting..." : "Withdraw"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <StatsCard title="Pending Balance" value={formatPrice(summary.pendingBalance)} icon={Clock} subtitle="Withdrawals processing" />
        <StatsCard
          title="This Month"
          value={formatPrice(thisMonth)}
          change={monthlyChange}
          icon={TrendingUp}
          trend={monthlyChange >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payout Methods</CardTitle>
            <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add payout method</DialogTitle>
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
                      placeholder="IBAN, card, or wallet number"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
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
                <div key={method.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {method.type === "bank_transfer" ? <Building2 className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.accountDetails}</p>
                    </div>
                  </div>
                  {method.isDefault && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Default
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Add a payout method to request withdrawals.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
