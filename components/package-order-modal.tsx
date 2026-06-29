'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertTriangle,
  Banknote,
  ExternalLink,
  Gift,
  Loader2,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlatformIconBadge } from '@/components/platform-icons';
import { ordersService } from '@/services/orders.service';
import type { PreOrderPaymentResponse } from '@/services/orders.service';
import { paymentsService, type BrandPaymentSummary } from '@/services/payments.service';
import type { DealType, Package } from '@/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface PackageOrderModalProps {
  isOpen: boolean;
  pkg: Package | null;
  onClose: () => void;
  onCreated?: (orderId: string) => void;
}

const getInitialAmount = (pkg: Package | null) => {
  if (!pkg) return '';
  if (pkg.dealType === 'barter') return '';
  return String(pkg.hybridCashAmount || pkg.price || '');
};

const dealMeta = {
  paid: {
    label: 'Paid',
    cta: 'Send Order Request',
    Icon: Banknote,
    badgeClass: 'border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]',
  },
  barter: {
    label: 'Barter',
    cta: 'Send Order Request',
    Icon: Gift,
    badgeClass: 'border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]',
  },
  hybrid: {
    label: 'Hybrid',
    cta: 'Send Order Request',
    Icon: Sparkles,
    badgeClass: 'border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]',
  },
};

const policyLinks = [
  { href: '/terms#payments', label: 'Terms' },
  { href: '/help', label: 'Refund help' },
  { href: '/contact', label: 'Contact support' },
];

const inputClassName =
  'h-10 rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus-visible:ring-[#2d6b4e]/20';
const textareaClassName =
  'resize-none rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus-visible:ring-[#2d6b4e]/20';
const labelClassName = 'text-[10px] font-bold uppercase tracking-widest text-[#8fa098]';
const pendingPackageTopupKey = 'chumchum:pending-package-order-topup';
const cashAmountLimits = { min: 500, max: 1_000_000 };

export function PackageOrderModal({ isOpen, pkg, onClose, onCreated }: PackageOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [orderStep, setOrderStep] = useState<'details' | 'review'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAssist, setPaymentAssist] = useState<PreOrderPaymentResponse | null>(null);
  const [walletSummary, setWalletSummary] = useState<BrandPaymentSummary | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [hasWalletError, setHasWalletError] = useState(false);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);

  useEffect(() => {
    if (!pkg || !isOpen) return;
    setAmount(getInitialAmount(pkg));
    setMessage(`Hi, I would like to order "${pkg.title}".`);
    setPaymentAssist(null);
    setIsRedirectingToCheckout(false);
    setOrderStep('details');
  }, [isOpen, pkg]);

  const needsAmount = pkg?.dealType === 'paid' || pkg?.dealType === 'hybrid';
  useEffect(() => {
    if (!isOpen || !needsAmount) {
      setWalletSummary(null);
      setIsLoadingWallet(false);
      setHasWalletError(false);
      return;
    }

    let isActive = true;
    setIsLoadingWallet(true);
    setHasWalletError(false);
    paymentsService.getBrandPaymentSummary()
      .then((summary) => {
        if (isActive) setWalletSummary(summary);
      })
      .catch(() => {
        if (isActive) {
          setWalletSummary(null);
          setHasWalletError(true);
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingWallet(false);
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, needsAmount, pkg?.id]);

  const priceSummary = useMemo(() => {
    if (!pkg) return '';
    if (pkg.dealType === 'barter') return pkg.barterValue || 'Barter deal';
    if (pkg.dealType === 'hybrid') return `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`;
    return formatPrice(pkg.price);
  }, [pkg]);
  const packageThumbnail = pkg ? (pkg as Package & { thumbnail?: string }).thumbnail : undefined;
  const cashAmount = Number(amount);
  const hasValidCashAmount = Boolean(
    needsAmount &&
    amount &&
    Number.isFinite(cashAmount) &&
    cashAmount >= cashAmountLimits.min &&
    cashAmount <= cashAmountLimits.max,
  );
  const walletBalance = paymentAssist?.balance ?? walletSummary?.walletBalance;
  const requiredAmount = paymentAssist?.required ?? (hasValidCashAmount ? cashAmount : 0);
  const walletShortfall = walletBalance == null || requiredAmount <= 0
    ? 0
    : Math.max(requiredAmount - walletBalance, 0);
  const topUpAmount = paymentAssist?.topUpAmount ?? (walletShortfall > 0 ? Math.max(walletShortfall, cashAmountLimits.min) : 0);
  const needsWalletTopUp = walletBalance != null && requiredAmount > 0 && walletShortfall > 0;
  const firstStepWalletHint = needsWalletTopUp ? `Need ${formatPrice(topUpAmount)} more` : null;

  const validateDetails = () => {
    if (!pkg) return false;

    if (needsAmount && (!amount || cashAmount <= 0)) {
      toast.error('Please enter the cash amount for this order.');
      return false;
    }

    if (needsAmount && (cashAmount < cashAmountLimits.min || cashAmount > cashAmountLimits.max)) {
      toast.error(
        `Cash amount must be between ${formatPrice(cashAmountLimits.min)} and ${formatPrice(cashAmountLimits.max)}.`,
      );
      return false;
    }

    if (!message.trim()) {
      toast.error('Please add a short message for the creator.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateDetails()) return;
    setOrderStep('review');
  };

  const handleSubmit = async () => {
    if (!pkg || !validateDetails()) return;

    if (needsWalletTopUp) {
      toast.warning('Add funds to place this order', {
        description: `${formatPrice(topUpAmount)} is needed before sending this request.`,
      });
      return;
    }

    setIsSubmitting(true);
    setPaymentAssist(null);

    try {
      if (needsAmount) {
        const paymentCheck = await ordersService.initiatePayment(cashAmount);
        if (!paymentCheck.walletSufficient) {
          setPaymentAssist(paymentCheck);
          toast.warning('Add funds to place this order', {
            description: `${formatPrice(paymentCheck.topUpAmount || 0)} is needed in your brand wallet.`,
          });
          return;
        }
      }

      const order = await ordersService.create({
        packageId: pkg.id,
        dealType: pkg.dealType.toUpperCase() as Uppercase<DealType>,
        amount: amount ? cashAmount : undefined,
        barterDetails: pkg.dealType === 'barter' || pkg.dealType === 'hybrid' ? message.trim() : undefined,
        message: message.trim(),
      });

      if (!order) {
        throw new Error('Order was created but could not be read back.');
      }

      toast.success('Order request sent', {
        description: 'The creator will see this as a pending order.',
      });
      onCreated?.(order.id);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      if (needsAmount && message.toLowerCase().includes('insufficient wallet')) {
        try {
          const paymentCheck = await ordersService.initiatePayment(cashAmount);
          setPaymentAssist(paymentCheck);
          toast.warning('Add funds to place this order', {
            description: `${formatPrice(paymentCheck.topUpAmount || Math.max(cashAmount, cashAmountLimits.min))} is needed in your brand wallet.`,
          });
        } catch {
          toast.error(message);
        }
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToCheckout = async () => {
    if (!needsAmount || topUpAmount <= 0) {
      toast.error('Top-up amount is unavailable. Please check the cash amount.');
      return;
    }

    setIsRedirectingToCheckout(true);
    try {
      const session = paymentAssist?.checkoutUrl
        ? { checkoutUrl: paymentAssist.checkoutUrl, sessionId: paymentAssist.sessionId }
        : await paymentsService.initiateSafepayTopup(topUpAmount);

      window.sessionStorage.setItem(pendingPackageTopupKey, JSON.stringify({
        returnPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        packageTitle: pkg?.title,
        topUpAmount,
        createdAt: Date.now(),
      }));
      window.location.href = session.checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start wallet top-up.';
      toast.error(message);
      setIsRedirectingToCheckout(false);
    }
  };

  const updateCashAmount = (value: string) => {
    if (value === '' || /^\d*$/.test(value)) {
      setAmount(value);
      setPaymentAssist(null);
    }
  };

  const normalizeCashAmount = () => {
    if (!amount) return;
    const numericAmount = Number(amount);
    const nextAmount = Math.min(
      cashAmountLimits.max,
      Math.max(cashAmountLimits.min, numericAmount),
    );
    setAmount(String(Number.isFinite(nextAmount) ? nextAmount : cashAmountLimits.min));
  };

  const reviewRows = needsAmount
    ? [
      { label: 'Order amount', value: formatPrice(cashAmount) },
    ]
    : [
      { label: 'Deal type', value: 'Barter' },
    ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border border-[#d1ddd6] bg-white p-0 shadow-[0_24px_64px_rgba(38,70,50,0.18)] sm:max-h-[90dvh] sm:max-w-lg [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogTitle className="sr-only">Order package</DialogTitle>
        <DialogDescription className="sr-only">
          Review package details, escrow protection, and payment policy before sending an order request.
        </DialogDescription>

        {pkg && (
          <>
            <div className="relative overflow-hidden bg-[#1e3d2e] px-5 py-5 text-white sm:px-6">
              <div
                className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25"
                style={{ background: 'radial-gradient(ellipse at 100% 0%, #e6aa38, transparent 65%)' }}
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Image
                    src={packageThumbnail || '/creator-card-fallback.svg'}
                    alt={pkg.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                    <PlatformIconBadge platform={pkg.platform} size="xs" className="border-0 bg-transparent shadow-none" />
                    {orderStep === 'details' ? 'Order package' : 'Review request'}
                  </span>
                  <h2 className="line-clamp-2 text-lg font-black leading-tight tracking-[-0.03em] text-white">
                    {pkg.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto bg-white px-5 py-5 sm:max-h-[calc(90dvh-10rem)] sm:px-6 sm:py-6">
              {orderStep === 'details' ? (
                <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
                    <div className="rounded-2xl border border-[#edf1ed] bg-[#fbfaf5] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">Price</p>
                      <p className="mt-1 text-[16px] font-black text-[#1e3d2e]">{priceSummary}</p>
                    </div>

                    {needsAmount && (
                      <div className="space-y-2">
                        <Label htmlFor="order-amount" className={labelClassName}>Cash Amount (PKR)</Label>
                        <Input
                          id="order-amount"
                          type="number"
                          min={cashAmountLimits.min}
                          max={cashAmountLimits.max}
                          value={amount}
                          onChange={(event) => updateCashAmount(event.target.value)}
                          onBlur={normalizeCashAmount}
                          placeholder="15000"
                          className={inputClassName}
                        />
                        <div className="flex items-center justify-between gap-3 text-[11px] font-bold leading-5">
                          <div className="min-w-0 text-[#185c39]">
                            {isLoadingWallet ? (
                              <span className="inline-flex items-center gap-1.5 text-[#607168]">
                                <Loader2 className="size-3 animate-spin" />
                                Avl Bal: Checking
                              </span>
                            ) : hasWalletError ? (
                              <span className="text-[#9a6a18]">Avl Bal: Unavailable</span>
                            ) : walletBalance != null ? (
                              <span>Avl Bal: {formatPrice(walletBalance)}</span>
                            ) : (
                              <span className="text-[#607168]">Avl Bal: --</span>
                            )}
                            {firstStepWalletHint && (
                              <span className="ml-2 inline-flex text-[#b77a12]">{firstStepWalletHint}</span>
                            )}
                          </div>
                          <span className="shrink-0 text-right text-[#8fa098]">
                            Limits: {formatPrice(cashAmountLimits.min)}-{cashAmountLimits.max.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="order-message" className={labelClassName}>Message</Label>
                      <Textarea
                        id="order-message"
                        rows={4}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Add campaign details, usage rights, deadlines, or approval notes."
                        className={textareaClassName}
                      />
                    </div>

                    <Button
                      className="h-11 w-full rounded-full bg-[#2d6b4e] text-sm font-extrabold text-white hover:bg-[#1f5239]"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-8 rounded-full px-2 text-xs font-bold text-[#607168] hover:bg-[#edf1ed] hover:text-[#1e3d2e]"
                        onClick={() => setOrderStep('details')}
                        disabled={isSubmitting || isRedirectingToCheckout}
                      >
                        <ArrowLeft className="mr-1 size-3.5" />
                        Back
                      </Button>
                      <span className="rounded-full bg-[#e7f0ea] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#185c39]">
                        Step 2 of 2
                      </span>
                    </div>

                    <div className="rounded-2xl border border-[#edf1ed] bg-[#fbfaf5] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ReceiptText className="size-4 text-[#2d6b4e]" />
                          <p className="text-sm font-black text-[#1e3d2e]">Payment summary</p>
                        </div>
                        {needsWalletTopUp && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fde8e8] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#b42318]">
                            <AlertTriangle className="size-3" />
                            Insufficient funds
                          </span>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {reviewRows.map((row) => (
                          <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
                            <span className="text-[#607168]">{row.label}</span>
                            <span className="shrink-0 text-right font-black text-[#1e3d2e]">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#d6eadf] bg-[#f3faf6] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <ShieldCheck className="size-4 text-[#2d6b4e]" />
                        <p className="text-sm font-black text-[#1e3d2e]">Protected payment</p>
                      </div>
                      <p className="text-sm leading-6 text-[#496159]">
                        {needsAmount
                          ? 'Your payment is held securely in escrow by ZingZing until the creator delivers. Once delivery is complete and approved, only then payout is released.'
                          : 'No cash payment is collected for this barter request. The creator will review your message and accept only if the exchange works for them.'}
                      </p>
                    </div>

                    {needsAmount && (
                      <div className="rounded-2xl border border-[#edf1ed] bg-white p-4">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-black text-[#b77a12]">
                          {policyLinks.map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            {label}
                            <ExternalLink className="size-3" />
                          </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      className="h-11 w-full rounded-full bg-[#2d6b4e] text-sm font-extrabold text-white hover:bg-[#1f5239] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={needsWalletTopUp ? handleContinueToCheckout : handleSubmit}
                      disabled={isSubmitting || isRedirectingToCheckout}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        needsWalletTopUp ? <Wallet className="mr-2 size-4" /> : <Send className="mr-2 size-4" />
                      )}
                      {isSubmitting ? 'Sending...' : needsWalletTopUp ? `Add ${formatPrice(topUpAmount)} to Continue` : dealMeta[pkg.dealType].cta}
                    </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
