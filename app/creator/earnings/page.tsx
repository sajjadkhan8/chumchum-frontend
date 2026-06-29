"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  DollarSign,
  Download,
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
import { CreatorMetricCard } from "@/components/creator-metric-card";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  earningsService,
  type EarningTransaction,
  type EarningsSummary,
  type PayoutMethod,
  type WithdrawalRequest,
} from "@/services/earnings.service";

type ActivityType = "earning" | "affiliate" | "withdrawal" | "fee" | "refund";

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
  awaitingApprovalGross: 0,
  awaitingApprovalNet: 0,
  awaitingApprovalFees: 0,
  awaitingApprovalCount: 0,
};

const toActivityType = (type: EarningTransaction["type"]): ActivityType => {
  if (type === "platform_fee") return "fee";
  if (type === "refund") return "refund";
  if (type === "affiliate_commission") return "affiliate";
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

export default function CreatorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary>(emptySummary);
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);

  const [timeRange, setTimeRange] = useState("30");

  const loadEarnings = async () => {
    try {
      const [summaryResponse, transactionsResponse, payoutResponse, withdrawalsResponse] =
        await Promise.all([
          earningsService.getSummary(),
          earningsService.getTransactions(),
          earningsService.getPayoutMethods(),
          earningsService.getWithdrawals(),
        ]);

      setSummary(summaryResponse);
      setTransactions(transactionsResponse);
      setPayoutMethods(payoutResponse);
      setWithdrawals(withdrawalsResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load earnings";
      toast.error(message);
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

  const earningActivities = activities.filter((activity) => activity.type === "earning" || activity.type === "affiliate" || activity.type === "refund");
  const withdrawalActivities = activities.filter((activity) => activity.type === "withdrawal" || activity.type === "fee");

  const thisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((tx) => (tx.type === "earning" || tx.type === "affiliate_commission") && tx.status === "completed")
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
      .filter((tx) => (tx.type === "earning" || tx.type === "affiliate_commission") && tx.status === "completed")
      .filter((tx) => {
        const date = new Date(tx.createdAt);
        return date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear();
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const monthlyChange = previousMonth > 0 ? ((thisMonth - previousMonth) / previousMonth) * 100 : 0;

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
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Earnings Analytics</h1>
          <p className="text-muted-foreground">Track earnings performance, balances, and payout history</p>
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
          <Button variant="outline" asChild>
            <Link href="/creator/payments">Open Payments Hub</Link>
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CreatorMetricCard dark title="Total Earnings" value={formatPrice(summary.totalEarned)} sub="lifetime creator revenue" Icon={DollarSign} />
        <CreatorMetricCard title="Available Balance" value={formatPrice(summary.availableBalance)} sub="ready to withdraw" Icon={Wallet} />
        <CreatorMetricCard title="Pending Balance" value={formatPrice(summary.pendingBalance)} sub="in escrow or pending release" Icon={Clock} />
        <CreatorMetricCard gold title="This Month" value={formatPrice(thisMonth)} sub={`${monthlyChange >= 0 ? "+" : "-"}${Math.abs(monthlyChange).toFixed(1)}% vs last month`} Icon={TrendingUp} />
      </div>

      <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        Configure payout methods, schedule, and compliance controls from
        <Link href="/creator/payments" className="ml-1 font-medium text-primary underline-offset-4 hover:underline">
          Payments
        </Link>
        .
      </div>

      <Tabs defaultValue="history" className="space-y-6">
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
      </Tabs>
    </div>
  );
}
