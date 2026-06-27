'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, CheckCircle, Clock, Gift, Loader2, PackageCheck, Send, Sparkles } from 'lucide-react';
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
import type { DealType, Package } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';
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

export function PackageOrderModal({ isOpen, pkg, onClose, onCreated }: PackageOrderModalProps) {
  const [amount, setAmount] = useState('');
  const [barterDetails, setBarterDetails] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pkg || !isOpen) return;
    setAmount(getInitialAmount(pkg));
    setBarterDetails(pkg.barterDescription || pkg.creatorExpectations || '');
    setMessage(`Hi, I would like to order "${pkg.title}".`);
  }, [isOpen, pkg]);

  const needsAmount = pkg?.dealType === 'paid' || pkg?.dealType === 'hybrid';
  const needsBarter = pkg?.dealType === 'barter' || pkg?.dealType === 'hybrid';

  const priceSummary = useMemo(() => {
    if (!pkg) return '';
    if (pkg.dealType === 'barter') return pkg.barterValue || 'Barter deal';
    if (pkg.dealType === 'hybrid') return `${formatPrice(pkg.hybridCashAmount || pkg.price)} + barter`;
    return formatPrice(pkg.price);
  }, [pkg]);

  const handleSubmit = async () => {
    if (!pkg) return;

    if (needsAmount && (!amount || Number(amount) <= 0)) {
      toast.error('Please enter the cash amount for this order.');
      return;
    }

    if (needsBarter && !barterDetails.trim()) {
      toast.error('Please describe the barter item or service.');
      return;
    }

    if (!message.trim()) {
      toast.error('Please add a short message for the creator.');
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await ordersService.create({
        packageId: pkg.id,
        dealType: pkg.dealType.toUpperCase() as Uppercase<DealType>,
        amount: amount ? Number(amount) : undefined,
        barterDetails: barterDetails.trim() || undefined,
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
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border border-[#d1ddd6] bg-white p-0 shadow-[0_24px_64px_rgba(38,70,50,0.18)] sm:max-h-[90dvh] sm:max-w-lg [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogTitle className="sr-only">Order package</DialogTitle>

        {pkg && (
          <>
            <div className="relative overflow-hidden bg-[#1e3d2e] px-5 pb-5 pt-5 text-white sm:px-6">
              <div
                className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25"
                style={{ background: 'radial-gradient(ellipse at 100% 0%, #e6aa38, transparent 65%)' }}
                aria-hidden
              />
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                  <PackageCheck className="size-3" />
                  Package Order
                </div>
                <p className="text-sm text-[#8fa098]">Send a request for</p>
                <div className="mt-3 flex items-start gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#f0c56e] ring-1 ring-white/15">
                    <PlatformIconBadge platform={pkg.platform} className="border-white/10 bg-transparent shadow-none" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-lg font-extrabold leading-tight tracking-[-0.02em] text-white">
                      {pkg.title}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold capitalize text-white/75">
                        {pkg.platform}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/75">
                        <Clock className="size-3" />
                        {pkg.deliveryDays} days
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100dvh-13rem)] space-y-5 overflow-y-auto bg-white px-5 py-5 sm:max-h-[calc(90dvh-12rem)] sm:px-6 sm:py-6">
              <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 border-b border-[#edf1ed] bg-[#fbfaf5] px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">
                      Selected Package
                    </p>
                    <p className="mt-1 line-clamp-2 text-[13px] font-extrabold leading-snug text-[#1e3d2e]">
                      {pkg.title}
                    </p>
                  </div>
                  <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-extrabold', dealMeta[pkg.dealType].badgeClass)}>
                    {(() => {
                      const DealIcon = dealMeta[pkg.dealType].Icon;
                      return <DealIcon className="size-3" />;
                    })()}
                    {dealMeta[pkg.dealType].label}
                  </span>
                </div>

                <div className="space-y-4 p-4">
                  <p className="line-clamp-3 text-[13px] leading-5 text-[#647168]">{pkg.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">Price</p>
                      <p className="mt-1 text-[15px] font-black text-[#1e3d2e]">{priceSummary}</p>
                    </div>
                    <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">Category</p>
                      <p className="mt-1 truncate text-[13px] font-extrabold text-[#1e3d2e]">{getCategoryLabel(pkg.category)}</p>
                    </div>
                  </div>

                  {pkg.deliverables.length > 0 && (
                    <div className="grid gap-2">
                      {pkg.deliverables.slice(0, 3).map((deliverable, index) => (
                        <div key={`${deliverable}-${index}`} className="flex items-start gap-2 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2 text-[12px]">
                          <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-[#2d6b4e]" />
                          <span className="leading-5 text-[#496159]">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {needsAmount && (
                <div className="space-y-2">
                  <Label htmlFor="order-amount" className={labelClassName}>Cash Amount (PKR)</Label>
                  <Input
                    id="order-amount"
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="15000"
                    className={inputClassName}
                  />
                </div>
              )}

              {needsBarter && (
                <div className="space-y-2">
                  <Label htmlFor="order-barter" className={labelClassName}>Barter Details</Label>
                  <Textarea
                    id="order-barter"
                    rows={3}
                    value={barterDetails}
                    onChange={(event) => setBarterDetails(event.target.value)}
                    placeholder="Describe the product, service, or experience you will provide."
                    className={textareaClassName}
                  />
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
                className="h-11 w-full rounded-full bg-[#2d6b4e] text-sm font-extrabold text-white hover:bg-[#1f5239] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmit}
                disabled={isSubmitting}
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
