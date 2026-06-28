"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarClock, CreditCard, Download, Plus, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { brandsService } from "@/services/brands.service";
import { printInvoice, type InvoiceBrandDetails } from "@/lib/invoice-pdf";
import type { Brand } from "@/types";

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

const statusColors: Record<string, string> = {
  paid: "bg-[#e7f0ea] text-[#185c39]",
  completed: "bg-[#e7f0ea] text-[#185c39]",
  active: "bg-[#e7f0ea] text-[#185c39]",
  processing: "bg-[#e8f0fb] text-[#2563b0]",
  scheduled: "bg-[#e8f0fb] text-[#2563b0]",
  pending_verification: "bg-[#e8f0fb] text-[#2563b0]",
  failed: "bg-[#fce4e4] text-[#c13a3a]",
  overdue: "bg-[#fce4e4] text-[#c13a3a]",
  disabled: "bg-[#fce4e4] text-[#c13a3a]",
};
const statusColor = (status: string) => statusColors[status] ?? "bg-[#fef9ec] text-[#8b5e12]";

function HeroStat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">
        <Icon className="size-3" />
        {label}
      </div>
      <p className="text-base font-black text-white">{value}</p>
    </div>
  );
}

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
  const [brandDetails, setBrandDetails] = useState<InvoiceBrandDetails>({ companyName: 'My Brand' });
  const [printingInvoiceId, setPrintingInvoiceId] = useState<string | null>(null);

  const [topupAmount, setTopupAmount] = useState("");
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isTopupSubmitting, setIsTopupSubmitting] = useState(false);

  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [isSavingMethod, setIsSavingMethod] = useState(false);
  const [newMethodType, setNewMethodType] = useState<BrandPaymentMethodType>("card");
  const [newMethodLabel, setNewMethodLabel] = useState("Corporate Card");
  const [newMethodMask, setNewMethodMask] = useState("");
  const [newMethodHolder, setNewMethodHolder] = useState("");
  const [pendingRemoveMethodId, setPendingRemoveMethodId] = useState<string | null>(null);

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
    brandsService.getMe().then((b: Brand | null) => {
      if (b) {
        setBrandDetails({
          companyName: b.name ?? 'My Brand',
          city: b.city ?? undefined,
          contactEmail: b.user?.email,
        });
      }
    }).catch(() => {});
  }, []);

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
    if (amount > 10_000_000) {
      toast.error("Maximum single top-up is PKR 10,000,000");
      return;
    }
    setIsTopupSubmitting(true);
    try {
      const session = await paymentsService.initiateSafepayTopup(amount);
      // Redirect to Safepay hosted checkout — payment is confirmed via webhook
      setIsTopupOpen(false);
      window.location.href = session.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not initiate payment. Please try again.";
      toast.error(message);
      setIsTopupSubmitting(false);
    }
    // Note: setIsTopupSubmitting(false) is intentionally NOT called on success
    // because we are navigating away — keeping the spinner avoids a flash of
    // the unsubmitted state before the redirect lands.
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
      setMethods((current) => current.map((m) => ({ ...m, isDefault: m.id === methodId })));
      toast.success("Default payment method updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not set default method";
      toast.error(message);
    }
  };

  const removeMethod = async (methodId: string) => {
    try {
      await paymentsService.removeBrandMethod(methodId);
      setMethods((current) => {
        const next = current.filter((m) => m.id !== methodId);
        if (next.length > 0 && !next.some((m) => m.isDefault)) next[0] = { ...next[0], isDefault: true };
        return next;
      });
      toast.success("Payment method removed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not remove payment method";
      toast.error(message);
    } finally {
      setPendingRemoveMethodId(null);
    }
  };

  const handlePrintInvoice = async (inv: BrandInvoice) => {
    setPrintingInvoiceId(inv.id);
    try {
      const detail = await paymentsService.getInvoiceDetail(inv.id);
      printInvoice(detail, brandDetails);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load invoice detail");
    } finally {
      setPrintingInvoiceId(null);
    }
  };

  const inputCls = "bg-white border-[#d1ddd6] text-[#173b2a] placeholder:text-[#a0b0aa] focus-visible:border-[#185c39] focus-visible:ring-2 focus-visible:ring-[#185c39]/20";
  const labelCls = "text-xs font-bold text-[#526259]";

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* Hero header */}
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                  <Wallet className="size-3.5" />
                  Payment workspace
                </div>
              </div>
              <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="mt-1 h-8 shrink-0 rounded-full bg-[#e6aa38] text-xs font-black text-[#173b2a] hover:bg-[#f0bb55]">
                    <Plus className="size-3.5" />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.75rem] border-[#d9e0d8] bg-[#fbfaf5] p-0 sm:max-w-md"
                  style={{
                    '--background': 'oklch(0.98 0.004 120)',
                    '--foreground': 'oklch(0.1 0 0)',
                    '--border': 'oklch(0.88 0.01 145)',
                    '--input': 'oklch(0.88 0.01 145)',
                    '--ring': 'oklch(0.55 0.17 145)',
                  } as React.CSSProperties}
                >
                  <div className="rounded-t-[1.75rem] bg-[#173b2a] px-5 py-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                      <Wallet className="size-3" />
                      Wallet Top-up
                    </div>
                    <DialogTitle className="mt-2 text-sm font-extrabold text-white">Add funds via Safepay</DialogTitle>
                    <DialogDescription className="mt-1 text-xs leading-5 text-[#8fb09a]">
                      You&apos;ll be redirected to Safepay&apos;s secure checkout to complete payment. Funds are credited to your wallet automatically once payment is confirmed.
                    </DialogDescription>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="topup-amount" className={labelCls}>Amount (PKR)</Label>
                      <Input
                        id="topup-amount"
                        type="number"
                        min={1000}
                        max={10000000}
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        className={inputCls}
                        placeholder="e.g. 50000"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[25000, 50000, 100000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setTopupAmount(String(amount))}
                          disabled={isTopupSubmitting}
                          className="rounded-full border border-[#d1ddd6] bg-white px-3 py-1 text-[11px] font-bold text-[#526259] transition hover:border-[#2d6b4e] hover:text-[#1e3d2e] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {formatPrice(amount)}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-[#c8e0d0] bg-[#eef6f1] px-3.5 py-3 text-xs text-[#185c39]">
                      <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                      <p>Minimum PKR 1,000 · Maximum PKR 10,000,000 · Secured by Safepay</p>
                    </div>

                    <DialogFooter className="gap-2 pt-1 sm:gap-2">
                      <Button
                        variant="outline"
                        className="h-9 flex-1 rounded-xl border-[#d9e0d8] text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                        onClick={() => setIsTopupOpen(false)}
                        disabled={isTopupSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-9 flex-1 rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
                        onClick={() => void handleTopup()}
                        disabled={isTopupSubmitting}
                      >
                        {isTopupSubmitting ? "Redirecting..." : "Continue to Safepay"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-4 sm:grid-cols-4">
              <HeroStat label="Wallet balance" value={formatPrice(summary.walletBalance)} icon={Wallet} />
              <HeroStat label="Monthly spend" value={formatPrice(summary.monthlySpend)} icon={CreditCard} />
              <HeroStat label="Pending escrow" value={formatPrice(summary.pendingEscrow)} icon={CalendarClock} />
              <HeroStat label="Processing" value={formatPrice(summary.processingPayouts)} icon={Building2} />
            </div>
          </div>
        </section>

        {/* Payment Methods + Governance */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_300px]">

          {/* Payment Methods */}
          <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#173b2a]">Payment Methods</p>
                <p className="text-xs text-[#718077]">Primary rails for funding and disbursements</p>
              </div>
              <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg border-[#d9e0d8] text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]">
                    <Plus className="size-3.5" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[calc(100%-1rem)] rounded-[1.75rem] border-[#d9e0d8] bg-[#fbfaf5] p-0 sm:max-w-md"
                  style={{
                    '--background': 'oklch(0.98 0.004 120)',
                    '--foreground': 'oklch(0.1 0 0)',
                    '--border': 'oklch(0.88 0.01 145)',
                    '--input': 'oklch(0.88 0.01 145)',
                    '--ring': 'oklch(0.55 0.17 145)',
                  } as React.CSSProperties}
                >
                  {/* Modal header */}
                  <div className="rounded-t-[1.75rem] bg-[#173b2a] px-5 py-4">
                    <DialogTitle className="text-sm font-extrabold text-white">Add Payment Method</DialogTitle>
                    <DialogDescription className="mt-0.5 text-xs text-[#8fb09a]">
                      Add a compliant payment rail for Pakistan disbursements.
                    </DialogDescription>
                  </div>

                  <div className="space-y-3 p-5">
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Type</Label>
                      <Select value={newMethodType} onValueChange={(v) => { const next = v as BrandPaymentMethodType; setNewMethodType(next); setNewMethodLabel(methodTypeLabels[next]); }}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(methodTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Display Name</Label>
                      <Input value={newMethodLabel} onChange={(e) => setNewMethodLabel(e.target.value)} className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Account Mask / Identifier</Label>
                      <Input value={newMethodMask} onChange={(e) => setNewMethodMask(e.target.value)} placeholder="**** **** **** 4242 or PK36ABCD…" className={inputCls} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelCls}>Account Holder</Label>
                      <Input value={newMethodHolder} onChange={(e) => setNewMethodHolder(e.target.value)} className={inputCls} />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="h-9 flex-1 rounded-xl border-[#d9e0d8] text-xs font-semibold text-[#526259] hover:bg-[#f4f2e9]"
                        onClick={() => setMethodDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-9 flex-1 rounded-xl bg-[#2d6b4e] text-xs font-bold text-white hover:bg-[#185c39] disabled:opacity-50"
                        onClick={() => void handleAddMethod()}
                        disabled={isSavingMethod}
                      >
                        {isSavingMethod ? "Saving…" : "Save Method"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="mt-4 space-y-2">
              {methods.length > 0 ? methods.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-[#173b2a]">{m.label}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(m.status)}`}>{m.status.replaceAll("_", " ")}</span>
                      {m.isDefault && <span className="rounded-full bg-[#e7f0ea] px-2 py-0.5 text-[10px] font-bold text-[#185c39]">Default</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-[#718077]">{methodTypeLabels[m.type]} · {m.accountMask} · {m.holderName}</p>
                  </div>
                  <div className="flex gap-1.5">
                    {!m.isDefault && (
                      <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2.5 text-xs font-semibold text-[#526259] hover:bg-[#e7f0ea] hover:text-[#185c39]" onClick={() => void setDefaultMethod(m.id)}>
                        Set default
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 rounded-lg px-2.5 text-xs font-semibold text-[#c13a3a] hover:bg-[#fce4e4]" onClick={() => setPendingRemoveMethodId(m.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.15rem] border border-dashed border-[#d9e0d8] p-6 text-center text-xs text-[#718077]">
                  No payment methods configured yet.
                </div>
              )}
            </div>
          </div>

          {/* Payout Governance */}
          <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <p className="text-sm font-bold text-[#173b2a]">Payout Governance</p>
            <p className="text-xs text-[#718077]">Approval and risk controls</p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                <div>
                  <p className="text-xs font-semibold text-[#173b2a]">Two-level approval</p>
                  <p className="text-[11px] text-[#718077]">Require two approvers before release</p>
                </div>
                <Switch
                  checked={controls.requireTwoApprovals}
                  onCheckedChange={(checked) => setControls((c) => ({ ...c, requireTwoApprovals: checked }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Auto-release after approval (days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={controls.autoReleaseAfterDays}
                  onChange={(e) => setControls((c) => ({ ...c, autoReleaseAfterDays: Number(e.target.value) || 1 }))}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelCls}>Low balance alert (PKR)</Label>
                <Input
                  type="number"
                  min={50000}
                  value={controls.lowBalanceAlertThreshold}
                  onChange={(e) => setControls((c) => ({ ...c, lowBalanceAlertThreshold: Number(e.target.value) || 50000 }))}
                  className={inputCls}
                />
              </div>

              <div className="flex items-start gap-2 rounded-[1.15rem] border border-[#c8e0d0] bg-[#eef6f1] px-3.5 py-3 text-xs text-[#185c39]">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                <p><span className="font-bold">Enhanced controls active</span> for your workspace.</p>
              </div>

              <Button onClick={() => void handleSaveControls()} disabled={isSavingControls} className="w-full rounded-xl bg-[#185c39] text-xs font-bold text-white hover:bg-[#173b2a]">
                {isSavingControls ? "Saving…" : "Save Controls"}
              </Button>
            </div>
          </div>
        </div>

        {/* Invoices + Disbursements */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">

          {/* Invoices */}
          <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <p className="text-sm font-bold text-[#173b2a]">Recent Invoices</p>
            <p className="text-xs text-[#718077]">Billing cycles and payable status</p>
            <div className="mt-4 space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-3 rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-[#173b2a]">{inv.periodLabel}</p>
                    <p className="text-[11px] text-[#718077]">Due {formatDate(new Date(inv.dueAt))}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#173b2a]">{formatPrice(inv.amount)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                    <button
                      disabled={printingInvoiceId === inv.id}
                      onClick={() => void handlePrintInvoice(inv)}
                      className="ml-2 inline-flex size-7 items-center justify-center rounded-lg border border-[#d9e0d8] text-[#647168] transition hover:bg-[#f4f2e9] disabled:opacity-50"
                      title="Print / Save as PDF"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {!isLoading && invoices.length === 0 && (
                <div className="rounded-[1.15rem] border border-dashed border-[#d9e0d8] p-6 text-center text-xs text-[#718077]">No invoices yet.</div>
              )}
            </div>
          </div>

          {/* Disbursements */}
          <div className="rounded-[1.75rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_60px_rgba(38,70,50,0.07)]">
            <p className="text-sm font-bold text-[#173b2a]">Creator Disbursements</p>
            <p className="text-xs text-[#718077]">Pending and scheduled creator releases</p>
            <div className="mt-4 space-y-2">
              {disbursements.map((d) => (
                <div key={d.id} className="rounded-[1.15rem] border border-[#e8ede8] bg-[#fbfaf5] px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#173b2a]">{d.creatorName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor(d.status)}`}>{d.status}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#718077]">{d.campaignName}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <p className="font-bold text-[#173b2a]">{formatPrice(d.amount)}</p>
                    <p className="text-[#718077]">{formatDate(new Date(d.releaseDate))}</p>
                  </div>
                </div>
              ))}
              {!isLoading && disbursements.length === 0 && (
                <div className="rounded-[1.15rem] border border-dashed border-[#d9e0d8] p-6 text-center text-xs text-[#718077]">No scheduled disbursements.</div>
              )}
            </div>
          </div>
        </div>

        {/* Compliance note */}
        <div className="mt-3 flex items-start gap-3 rounded-[1.35rem] border border-[#d9e0d8] bg-white px-4 py-3.5">
          <ReceiptText className="mt-0.5 size-4 shrink-0 text-[#718077]" />
          <p className="text-xs text-[#718077]">
            <span className="font-semibold text-[#526259]">Compliance: </span>
            For Pakistan payouts, keep business details current, maintain sufficient wallet balance, and use approved payout rails.
          </p>
        </div>

      </div>

      <AlertDialog open={!!pendingRemoveMethodId} onOpenChange={(open) => { if (!open) setPendingRemoveMethodId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This payment method will be permanently removed from your account. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#c13a3a] text-white hover:bg-[#a12e2e]"
              onClick={() => pendingRemoveMethodId && void removeMethod(pendingRemoveMethodId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
