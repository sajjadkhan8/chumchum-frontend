"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  CreditCard,
  Building2,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { MemoizedStatsCard } from "@/components/stats-card";
import { formatPrice, formatDate } from "@/lib/utils";

const earningsData = {
  totalEarnings: 485000,
  availableBalance: 125000,
  pendingBalance: 85000,
  thisMonth: 145000,
  lastMonth: 128000,
};

const transactions = [
  {
    id: "1",
    type: "earning",
    description: "Instagram Story Pack - FreshMart",
    amount: 25000,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "completed",
  },
  {
    id: "2",
    type: "withdrawal",
    description: "Withdrawal - STC Pay",
    amount: -50000,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: "completed",
  },
  {
    id: "3",
    type: "earning",
    description: "Product Review - TechZone",
    amount: 45000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: "completed",
  },
  {
    id: "4",
    type: "earning",
    description: "Full Campaign - StyleHub",
    amount: 120000,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "pending",
  },
  {
    id: "5",
    type: "withdrawal",
    description: "Withdrawal - Mada",
    amount: -75000,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: "completed",
  },
];

const payoutMethods = [
  {
    id: "1",
    type: "stcpay",
    name: "STC Pay",
    details: "**** 1234",
    isDefault: true,
  },
  {
    id: "2",
    type: "mada",
    name: "Mada",
    details: "**** 5678",
    isDefault: false,
  },
  {
    id: "3",
    type: "bank",
    name: "Bank Transfer",
    details: "IBAN SA03****7519",
    isDefault: false,
  },
  {
    id: "4",
    type: "applepay",
    name: "Apple Pay",
    details: "+96655****567",
    isDefault: false,
  },
];

export default function CreatorEarningsPage() {
  const [timeRange, setTimeRange] = useState("30");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState(payoutMethods[0].id);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const monthlyChange =
    ((earningsData.thisMonth - earningsData.lastMonth) /
      earningsData.lastMonth) *
    100;

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Earnings
          </h1>
          <p className="text-muted-foreground">
            Track your income and manage withdrawals
          </p>
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MemoizedStatsCard
          title="Total Earnings"
          value={formatPrice(earningsData.totalEarnings)}
          icon={DollarSign}
        />
        <MemoizedStatsCard
          title="Available Balance"
          value={formatPrice(earningsData.availableBalance)}
          icon={Wallet}
          action={
            <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="mt-2 w-full">
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount (SAR)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Available: {formatPrice(earningsData.availableBalance)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {payoutMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name} ({method.details})
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
                  <Button onClick={() => setWithdrawDialogOpen(false)}>
                    Withdraw
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        />
        <MemoizedStatsCard
          title="Pending Balance"
          value={formatPrice(earningsData.pendingBalance)}
          icon={Clock}
          subtitle="In escrow"
        />
        <MemoizedStatsCard
          title="This Month"
          value={formatPrice(earningsData.thisMonth)}
          change={monthlyChange}
          icon={TrendingUp}
          trend={monthlyChange >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions */}
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

              <TabsContent value="all" className="space-y-3">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          tx.type === "earning"
                            ? "bg-green-100 text-green-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {tx.type === "earning" ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tx.amount >= 0 ? "text-green-600" : "text-foreground"
                        }`}
                      >
                        {tx.amount >= 0 ? "+" : ""}
                        {formatPrice(Math.abs(tx.amount))}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          tx.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="earnings" className="space-y-3">
                {transactions
                  .filter((tx) => tx.type === "earning")
                  .map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <ArrowDownRight className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">
                        +{formatPrice(tx.amount)}
                      </p>
                    </motion.div>
                  ))}
              </TabsContent>

              <TabsContent value="withdrawals" className="space-y-3">
                {transactions
                  .filter((tx) => tx.type === "withdrawal")
                  .map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <ArrowUpRight className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(tx.date)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(Math.abs(tx.amount))}
                      </p>
                    </motion.div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Payout Methods */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Payout Methods</CardTitle>
            <Button variant="ghost" size="sm">
              Add New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {payoutMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {method.type === "bank" ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <Wallet className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {method.details}
                    </p>
                  </div>
                </div>
                {method.isDefault && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Default
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
