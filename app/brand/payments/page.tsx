"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, CalendarClock, CreditCard, Plus, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/stats-card";
import { formatDate, formatPrice } from "@/lib/utils";
import {
  paymentsService,
  type BrandPaymentMethod,
  type BrandPaymentMethodType,
  type BrandPayoutControls,
  type BrandDisbursement,
  type BrandInvoice,
  type BrandPaymentSummary,
} from "@/services/payments.service";

const emptySummary: BrandPaymentSummary = {
  walletBalance: 0,
  monthlySpend: 0,
  pendingEscrow: 0,
  processingPayouts: 0,
  nextInvoiceDate: new Date().toISOString(),
};

const methodTypeLabels: Record<BrandPaymentMethodType, string> = {
  card: "Corporate Card",
  bank_transfer: "Bank Transfer",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  sadapay: "SadaPay",
  nayapay: "NayaPay",
};

const statusVariant = (status: string) => {
  if (status === "paid" || status === "completed" || status === "active") {
    return "bg-green-100 text-green-700";
  }
  if (status === "processing" || status === "scheduled" || status === "pending_verification") {
    return "bg-blue-100 text-blue-700";
  }
  if (status === "failed" || status === "overdue" || status === "disabled") {
    return "bg-red-100 text-red-700";
  }
  return "bg-yellow-100 text-yellow-700";
};

export default function BrandPaymentsPage() {
  const [summary, setSummary] = useState<BrandPaymentSummary>(emptySummary);
  const [methods, setMethods] = useState<BrandPaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<BrandInvoice[]>([]);
  const [disbursements, setDisbursements] = useState<BrandDisbursement[]>([]);
  const [controls, setControls] = useState<BrandPayoutControls>({
    requireTwoApprovals: true,
    autoReleaseAfterDays: 5,
    lowBalanceAlertThreshold: 300000,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingControls, setIsSavingControls] = useState(false);

  const [topupAmount, setTopupAmount] = useState("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isTopupSubmitting, setIsTopupSubmitting] = useState(false);

  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState<BrandPaymentMethodType>("card");
  const [newMethodLabel, setNewMethodLabel] = useState("Corporate Card");
  const [newMethodMask, setNewMethodMask] = useState("");
  const [newMethodHolder, setNewMethodHolder] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const hub = await paymentsService.getBrandPaymentsHub();
      setSummary(hub.summary);
      setMethods(hub.methods);
      setInvoices(hub.invoices);
      setDisbursements(hub.disbursements);
      setControls(hub.controls);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load payments workspace";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const defaultMethod = useMemo(() => methods.find((method) => method.isDefault), [methods]);

  const handleSaveControls = async () => {
    setIsSavingControls(true);
    try {
      const saved = await paymentsService.updateBrandPayoutControls({
        ...controls,
        autoReleaseAfterDays: Math.max(1, controls.autoReleaseAfterDays),
        lowBalanceAlertThreshold: Math.max(50000, controls.lowBalanceAlertThreshold),
      });
      setControls(saved);
      toast.success("Payout governance controls saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save payout controls";
      toast.error(message);
    } finally {
      setIsSavingControls(false);
    }
  };

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!Number.isFinite(amount) || amount < 1000) {
      toast.error("Enter a valid top-up amount (minimum PKR 1,000)");
      return;
    }

    setIsTopupSubmitting(true);
    try {
      const next = await paymentsService.topUpBrandWallet(amount);
      setSummary(next);
      setTopupAmount("");
      setIsTopupOpen(false);
      toast.success("Wallet credited successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet top-up failed";
      toast.error(message);
    } finally {
      setIsTopupSubmitting(false);
    }
  };

  const handleAddMethod = async () => {
    if (!newMethodMask.trim() || !newMethodHolder.trim()) {
      toast.error("Payment details and account holder are required");
      return;
    }

    setIsSavingMethod(true);
    try {
      const created = await paymentsService.addBrandPaymentMethod({
        type: newMethodType,
        label: newMethodLabel.trim() || methodTypeLabels[newMethodType],
        accountMask: newMethodMask.trim(),
        holderName: newMethodHolder.trim(),
        isDefault: methods.length === 0,
      });
      setMethods((current) => [...current, created]);
      setNewMethodMask("");
      setMethodDialogOpen(false);
      toast.success("Payment method added");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not add payment method";
      toast.error(message);
    } finally {
      setIsSavingMethod(false);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      await paymentsService.setBrandDefaultMethod(methodId);
      setMethods((current) => current.map((method) => ({ ...method, isDefault: method.id === methodId })));
      toast.success("Default payment method updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not set default method";
      toast.error(message);
    }
  };

  const removeMethod = async (methodId: string) => {
    if (!window.confirm("Remove this payment method?")) return;

    try {
      await paymentsService.removeBrandMethod(methodId);
      setMethods((current) => {
        const next = current.filter((method) => method.id !== methodId);
        if (next.length > 0 && !next.some((method) => method.isDefault)) {
          next[0] = { ...next[0], isDefault: true };
        }
        return next;
      });
      toast.success("Payment method removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove payment method";
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Payments & Disbursements</h1>
          <p className="text-muted-foreground">Fund campaigns, manage payment rails, and control creator payout governance</p>
        </div>
        <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Wallet Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Top up campaign wallet</DialogTitle>
              <DialogDescription>Use your default payment method to add funds instantly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-2">
                <Label htmlFor="topup-amount">Amount (PKR)</Label>
                <Input
                  id="topup-amount"
                  type="number"
                  min={1000}
                  value={topupAmount}
                  onChange={(event) => setTopupAmount(event.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Charged to: {defaultMethod ? `${defaultMethod.label} (${defaultMethod.accountMask})` : "No default payment method"}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTopupOpen(false)}>Cancel</Button>
              <Button onClick={() => void handleTopup()} disabled={isTopupSubmitting || !defaultMethod}>
                {isTopupSubmitting ? "Processing..." : "Top Up"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Wallet Balance" value={formatPrice(summary.walletBalance)} icon={Wallet} />
        <StatsCard title="Monthly Spend" value={formatPrice(summary.monthlySpend)} icon={CreditCard} />
        <StatsCard title="Pending Escrow" value={formatPrice(summary.pendingEscrow)} icon={CalendarClock} />
        <StatsCard title="Processing Payouts" value={formatPrice(summary.processingPayouts)} icon={Building2} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Primary rails for campaign funding and creator disbursements</CardDescription>
            </div>
            <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add payment method</DialogTitle>
                  <DialogDescription>Add a compliant payment rail for Pakistan disbursements.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newMethodType}
                      onValueChange={(value) => {
                        const next = value as BrandPaymentMethodType;
                        setNewMethodType(next);
                        setNewMethodLabel(methodTypeLabels[next]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(methodTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input value={newMethodLabel} onChange={(event) => setNewMethodLabel(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Mask / Identifier</Label>
                    <Input
                      value={newMethodMask}
                      onChange={(event) => setNewMethodMask(event.target.value)}
                      placeholder="**** **** **** 4242 or PK36ABCD..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder</Label>
                    <Input value={newMethodHolder} onChange={(event) => setNewMethodHolder(event.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMethodDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => void handleAddMethod()} disabled={isSavingMethod}>
                    {isSavingMethod ? "Saving..." : "Save Method"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {methods.length > 0 ? (
              methods.map((method) => (
                <div key={method.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{method.label}</p>
                        <Badge variant="secondary" className={statusVariant(method.status)}>{method.status.replaceAll("_", " ")}</Badge>
                        {method.isDefault && <Badge className="bg-primary/10 text-primary">Default</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{methodTypeLabels[method.type]} - {method.accountMask}</p>
                      <p className="text-xs text-muted-foreground">Holder: {method.holderName}</p>
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => void setDefaultMethod(method.id)}>
                          Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => void removeMethod(method.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No payment methods configured yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Governance</CardTitle>
            <CardDescription>Industry-standard controls for approval and risk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Two-level approval</p>
                <p className="text-sm text-muted-foreground">Require two approvers before release.</p>
              </div>
              <Switch
                checked={controls.requireTwoApprovals}
                onCheckedChange={(checked) => setControls((current) => ({ ...current, requireTwoApprovals: checked }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Auto-release after deliverable approval (days)</Label>
              <Input
                type="number"
                min={1}
                value={controls.autoReleaseAfterDays}
                onChange={(event) => setControls((current) => ({ ...current, autoReleaseAfterDays: Number(event.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Low balance alert threshold (PKR)</Label>
              <Input
                type="number"
                min={50000}
                value={controls.lowBalanceAlertThreshold}
                onChange={(event) =>
                  setControls((current) => ({
                    ...current,
                    lowBalanceAlertThreshold: Number(event.target.value) || 50000,
                  }))
                }
              />
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <ShieldCheck className="h-4 w-4" />
                Security posture
              </div>
              Enhanced payout controls are active for your workspace.
            </div>
            <Button onClick={() => void handleSaveControls()} disabled={isSavingControls} className="w-full">
              {isSavingControls ? "Saving..." : "Save Controls"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Billing cycles and payable status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{invoice.periodLabel}</p>
                  <p className="text-xs text-muted-foreground">Due {formatDate(new Date(invoice.dueAt))}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(invoice.amount)}</p>
                  <Badge variant="secondary" className={statusVariant(invoice.status)}>{invoice.status}</Badge>
                </div>
              </div>
            ))}
            {!isLoading && invoices.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No invoices yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Creator Disbursements</CardTitle>
            <CardDescription>Pipeline of pending and scheduled creator releases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {disbursements.map((disbursement) => (
              <div key={disbursement.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="font-medium">{disbursement.creatorName}</p>
                  <Badge variant="secondary" className={statusVariant(disbursement.status)}>{disbursement.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{disbursement.campaignName}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <p>{formatPrice(disbursement.amount)}</p>
                  <p className="text-muted-foreground">{formatDate(new Date(disbursement.releaseDate))}</p>
                </div>
              </div>
            ))}
            {!isLoading && disbursements.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No scheduled disbursements.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Compliance Notes</CardTitle>
          <CardDescription>
            For Pakistan payouts: keep business details current, maintain sufficient wallet balance, and use approved payout rails.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

