'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Banknote, Gift, Loader2, Send, Sparkles, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlatformIconBadge } from '@/components/platform-icons';
import { ordersService } from '@/services/orders.service';
import type { PreOrderPaymentResponse } from '@/services/orders.service';
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
    cta: 'Send Cash Request',
    Icon: Banknote,
    badgeClass: 'border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]',
  },
  barter: {
    label: 'Barter',
    cta: 'Send Barter Request',
    Icon: Gift,
    badgeClass: 'border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]',
  },
  hybrid: {
    label: 'Hybrid',
    cta: 'Send Hybrid Request',
    Icon: Sparkles,
    badgeClass: 'border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]',
  },
};

const inputClassName =
  'h-10 rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus-visible:ring-[#2d6b4e]/20';
const textareaClassName =
  'resize-none rounded-xl border-[#d9e0d8] bg-[#f4f2e9] text-sm text-[#1e3d2e] placeholder:text-[#8fa098] focus-visible:ring-[#2d6b4e]/20';
const labelClassName = 'text-[10px] font-bold uppercase tracking-widest text-[#8fa098]';
const pendingPackageTopupKey = 'chumchum:pending-package-order-topup';
const cashAmountLimits = { min: 100, max: 1_000_000 };

export function PackageOrderModal({ isOpen, pkg, onClose, onCreated }: PackageOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAssist, setPaymentAssist] = useState<PreOrderPaymentResponse | null>(null);
  const [isRedirectingToCheckout, setIsRedirectingToCheckout] = useState(false);

  useEffect(() => {
    if (!pkg || !isOpen) return;
    setAmount(getInitialAmount(pkg));
    setMessage(`Hi, I would like to order "${pkg.title}".`);
    setPaymentAssist(null);
    setIsRedirectingToCheckout(false);
  }, [isOpen, pkg]);

  const needsAmount = pkg?.dealType === 'paid' || pkg?.dealType === 'hybrid';
  const priceSummary = useMemo(() => {
    if (!pkg) return '';
    if (pkg.dealType === 'barter') return pkg.barterValue || 'Barter deal';
    if (pkg.dealType === 'hybrid') return `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`;
    return formatPrice(pkg.price);
  }, [pkg]);
  const packageThumbnail = pkg ? (pkg as Package & { thumbnail?: string }).thumbnail : undefined;

  const handleSubmit = async () => {
    if (!pkg) return;
    const cashAmount = Number(amount);

    if (needsAmount && (!amount || cashAmount <= 0)) {
      toast.error('Please enter the cash amount for this order.');
      return;
    }

    if (needsAmount && (cashAmount < cashAmountLimits.min || cashAmount > cashAmountLimits.max)) {
      toast.error(
        `Cash amount must be between ${formatPrice(cashAmountLimits.min)} and ${formatPrice(cashAmountLimits.max)}.`,
      );
      return;
    }

    if (!message.trim()) {
      toast.error('Please add a short message for the creator.');
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
            description: `${formatPrice(paymentCheck.topUpAmount || Math.max(cashAmount, 1000))} is needed in your brand wallet.`,
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

  const handleContinueToCheckout = () => {
    if (!paymentAssist?.checkoutUrl) {
      toast.error('Checkout link is unavailable. Please try again.');
      return;
    }
    window.sessionStorage.setItem(pendingPackageTopupKey, JSON.stringify({
      returnPath: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      packageTitle: pkg?.title,
      topUpAmount: paymentAssist.topUpAmount,
      createdAt: Date.now(),
    }));
    setIsRedirectingToCheckout(true);
    window.location.href = paymentAssist.checkoutUrl;
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border border-[#d1ddd6] bg-white p-0 shadow-[0_24px_64px_rgba(38,70,50,0.18)] sm:max-h-[90dvh] sm:max-w-lg [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogTitle className="sr-only">Order package</DialogTitle>

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
                    Order package
                  </span>
                  <h2 className="line-clamp-2 text-lg font-black leading-tight tracking-[-0.03em] text-white">
                    {pkg.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-11rem)] space-y-5 overflow-y-auto bg-white px-5 py-5 sm:max-h-[calc(90dvh-10rem)] sm:px-6 sm:py-6">
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
                  <p className="text-[11px] font-medium leading-5 text-[#8fa098]">
                    Cash must be between {formatPrice(cashAmountLimits.min)} and {formatPrice(cashAmountLimits.max)}.
                  </p>
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

              {paymentAssist && (
                <div className="rounded-2xl border border-[#f1d38a] bg-[#fff8e8] p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0c56e]/25 text-[#8b5e12]">
                      <Wallet className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[12px] font-black uppercase tracking-[0.12em] text-[#8b5e12]">
                        <AlertCircle className="size-3.5" />
                        Wallet top-up needed
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-[#6c5b32]">
                        Your wallet has {formatPrice(paymentAssist.balance)}. This order needs {formatPrice(paymentAssist.required)}, so add {formatPrice(paymentAssist.topUpAmount || 0)} to continue.
                      </p>
                      <Button
                        className="mt-3 h-10 w-full rounded-full bg-[#e6aa38] text-xs font-black text-[#173b2a] hover:bg-[#f0bb55] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleContinueToCheckout}
                        disabled={isRedirectingToCheckout || !paymentAssist.checkoutUrl}
                      >
                        {isRedirectingToCheckout ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Wallet className="mr-2 size-4" />
                        )}
                        {isRedirectingToCheckout ? 'Redirecting...' : `Add ${formatPrice(paymentAssist.topUpAmount || 0)} via Safepay`}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="h-11 w-full rounded-full bg-[#2d6b4e] text-sm font-extrabold text-white hover:bg-[#1f5239] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isSubmitting || isRedirectingToCheckout}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {isSubmitting ? 'Sending...' : dealMeta[pkg.dealType].cta}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
