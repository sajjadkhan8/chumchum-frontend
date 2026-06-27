'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Gift, PackageCheck, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Package, PackageAnalytics } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { PlatformIconBadge, getPlatformMeta } from '@/components/platform-icons';
import { getCategoryLabel } from '@/lib/categories';

type DisplayPackage = Package & {
  thumbnail?: string;
  shortDescription?: string;
  fullDescription?: string;
  analytics?: Partial<PackageAnalytics>;
};

interface PackageCardProps {
  pkg: DisplayPackage;
  onOrder?: () => void;
  onViewDetails?: () => void;
  activeOrder?: { id: string; status: string } | null;
  onViewActiveOrder?: () => void;
  className?: string;
}

const orderStatusLabel = (status: string) => status.replace(/_/g, ' ');

export function PackageCard({ pkg, onOrder, onViewDetails, activeOrder, onViewActiveOrder, className }: PackageCardProps) {
  const categoryLabel = getCategoryLabel(pkg.category);
  const showCashAmount = pkg.dealType === 'paid' ? pkg.price : pkg.hybridCashAmount || pkg.price;
  const displayDescription = pkg.shortDescription || pkg.description;
  const bannerImage = pkg.thumbnail || '/creator-card-fallback.svg';
  const platformLabel = getPlatformMeta(pkg.platform)?.label ?? pkg.platform;
  const visibleDeliverables = pkg.deliverables.slice(0, 1);
  const extraDeliverables = Math.max(0, pkg.deliverables.length - visibleDeliverables.length);
  const dealMeta = {
    paid: {
      label: 'Paid',
      className: 'border-[#d6eadf] bg-[#e8f0ec] text-[#2d6b4e]',
      Icon: CheckCircle,
    },
    barter: {
      label: 'Barter',
      className: 'border-[#efcf83] bg-[#fff1cd] text-[#8b5e12]',
      Icon: Gift,
    },
    hybrid: {
      label: 'Hybrid',
      className: 'border-sky-100 bg-sky-50 text-sky-700',
      Icon: Sparkles,
    },
  }[pkg.dealType];
  const DealIcon = dealMeta.Icon;
  const priceBlock = pkg.dealType === 'barter'
    ? {
      label: 'Barter Deal',
      value: pkg.barterValue || 'Exchange',
      Icon: Gift,
    }
    : pkg.dealType === 'hybrid'
      ? {
        label: 'Hybrid Deal',
        value: `${formatPrice(showCashAmount)} + barter`,
        Icon: Sparkles,
      }
      : {
        label: 'Package Price',
        value: formatPrice(pkg.price),
        Icon: CheckCircle,
      };
  const PriceIcon = priceBlock.Icon;
  const analytics = pkg.analytics;
  const signalValue = analytics?.completionRate || analytics?.conversionRate || (pkg.ordersCompleted > 0 ? 92 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group rounded-[1.45rem] border bg-white shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)]',
          activeOrder ? 'border-[#e6aa38] ring-4 ring-[#e6aa38]/12' : 'border-[#d9e0d8]',
          className
        )}
      >
        <CardContent className="p-3.5 sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-start">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-[0.9rem] border border-[#d9e0d8] bg-[#e8f0ec] sm:size-14">
                  <Image
                    src={bannerImage}
                    alt={pkg.title}
                    fill
                    sizes="56px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="line-clamp-1 text-lg font-black tracking-[-0.04em] text-[#173b2a] sm:text-xl">
                      {pkg.title}
                    </h3>
                    <Badge className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 shadow-none ${dealMeta.className}`}>
                      <DealIcon className="mr-1 size-3" />
                      {dealMeta.label}
                    </Badge>
                    {pkg.isPopular && (
                      <Badge className="rounded-full bg-[#fdf3dc] px-2 py-0.5 text-[10px] font-black text-[#9b6712] ring-1 ring-[#e3a52f]/35 shadow-none">
                        <TrendingUp className="mr-1 size-3" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[13px] font-bold text-[#647168]">{displayDescription}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#8a958d]">{categoryLabel} package</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 text-[12px] font-bold text-[#607168]">
                <span className="inline-flex min-w-0 items-center gap-1.5 rounded-xl bg-[#fbfaf5] px-2.5 py-1.5">
                  <Wallet className="size-3.5 shrink-0 text-[#185c39]" />
                  <span className="line-clamp-1">{priceBlock.value}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#fbfaf5] px-2.5 py-1.5">
                  <Clock className="size-3.5 shrink-0 text-[#185c39]" />
                  {pkg.deliveryDays} days
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#fbfaf5] px-2.5 py-1.5">
                  <PackageCheck className="size-3.5 shrink-0 text-[#185c39]" />
                  {pkg.ordersCompleted} orders
                </span>
              </div>

              <div className="mt-2 rounded-[1rem] bg-[#fbfaf5] px-2.5 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <PlatformIconBadge platform={pkg.platform} size="xs" className="border-0 bg-white shadow-none" />
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.15em] text-[#2d6b4e]">
                      {platformLabel} deliverables
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-[#7b867f]">
                    {pkg.deliverables.length}
                  </span>
                </div>
                <div className="mt-1.5 grid gap-1">
                  {visibleDeliverables.length > 0 ? visibleDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-center gap-2 text-[12px] font-bold text-[#173b2a]">
                      <CheckCircle className="size-3.5 shrink-0 text-[#185c39]" />
                      <span className="line-clamp-1">{deliverable}</span>
                    </div>
                  )) : (
                    <p className="text-sm font-bold text-[#647168]">Deliverables will be confirmed with the creator.</p>
                  )}
                </div>
                {extraDeliverables > 0 && (
                  <p className="mt-1 pl-6 text-xs font-black text-[#718077]">
                    +{extraDeliverables} more deliverable{extraDeliverables === 1 ? '' : 's'}
                  </p>
                )}
              </div>

              {(pkg.tags.length > 0 || pkg.barterDescription || pkg.creatorExpectations || activeOrder) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {pkg.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#f4f2e9] px-2 py-0.5 text-[10px] font-black text-[#607168]">
                      {tag}
                    </span>
                  ))}
                  {pkg.tags.length > 2 && (
                    <span className="rounded-full bg-[#f4f2e9] px-2 py-0.5 text-[10px] font-black text-[#7b867f]">
                      +{pkg.tags.length - 2}
                    </span>
                  )}
                  {pkg.barterDescription && (
                    <span className="max-w-full rounded-full bg-[#fdf3dc] px-2 py-0.5 text-[10px] font-black text-[#9b6712]">
                      {pkg.barterDescription}
                    </span>
                  )}
                  {activeOrder && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf3dc] px-2 py-0.5 text-[10px] font-black text-[#9b6712]">
                      <AlertCircle className="size-3 shrink-0" />
                      Active {orderStatusLabel(activeOrder.status)} order already exists.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-[1.05rem] bg-[#fbfaf5] p-2.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7b867f]">Package fit</p>
                <div className="flex items-center gap-1.5 text-[12px] font-black text-[#173b2a]">
                  <PriceIcon className="size-3.5 text-[#185c39]" />
                  {signalValue > 0 ? `${signalValue}%` : 'New'}
                </div>
              </div>

              <div className="flex items-end justify-between gap-2">
                <p className="line-clamp-1 text-base font-black tracking-[-0.04em] text-[#173b2a]">
                  {priceBlock.value}
                </p>
                <p className="shrink-0 text-[11px] font-bold text-[#718077]">
                  {analytics?.conversionRate || 0}% conv.
                </p>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[#e6ece6]">
                <div
                  className="h-full rounded-full bg-[#185c39]"
                  style={{ width: `${Math.max(8, Math.min(100, signalValue || 24))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {onViewDetails && (
                  <Button
                    variant="outline"
                    onClick={onViewDetails}
                    className="h-8 rounded-full border-[#d9e0d8] bg-white text-[12px] font-black text-[#185c39] hover:bg-[#e7f0ea]"
                  >
                    Details
                  </Button>
                )}
                <Button
                  onClick={activeOrder ? onViewActiveOrder : onOrder}
                  className={cn(
                    "h-8 rounded-full text-[12px] font-black text-white",
                    activeOrder ? "bg-[#9b6712] hover:bg-[#7c510e]" : "bg-[#185c39] hover:bg-[#12462b]"
                  )}
                  disabled={activeOrder ? !onViewActiveOrder : !onOrder}
                >
                  {activeOrder ? 'View Order' : 'Order Now'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
