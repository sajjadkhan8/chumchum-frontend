'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, Gift, PackageCheck, Sparkles, TrendingUp } from 'lucide-react';
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
  const visibleDeliverables = pkg.deliverables.slice(0, 2);
  const extraDeliverables = Math.max(0, pkg.deliverables.length - visibleDeliverables.length);
  const compactStats = [
    { label: `${pkg.deliveryDays}d`, title: 'Delivery', Icon: Clock },
    { label: `${pkg.ordersCompleted}`, title: 'Orders', Icon: PackageCheck },
    ...(pkg.analytics?.conversionRate
      ? [{ label: `${pkg.analytics.conversionRate}%`, title: 'Convert', Icon: TrendingUp }]
      : []),
  ];
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-[#dce8e2] bg-white transition-colors duration-200 hover:border-[#2d6b4e]/45',
          className
        )}
        style={{ boxShadow: '0 10px 28px rgba(30,61,46,0.07), 0 1px 2px rgba(30,61,46,0.04)' }}
      >
        <CardContent className="p-0">
          <div className="grid gap-0 md:grid-cols-[148px_minmax(0,1fr)]">
            <div className="relative min-h-36 overflow-hidden bg-[#e8f0ec] md:min-h-full">
              <Image
                src={bannerImage}
                alt={pkg.title}
                fill
                sizes="(max-width: 768px) 100vw, 148px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-white/92 px-2 py-1 shadow-sm backdrop-blur">
                <PlatformIconBadge platform={pkg.platform} size="xs" className="border-0 bg-transparent shadow-none" />
                <span className="truncate text-[10px] font-black text-[#1e3d2e]">{platformLabel}</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="grid gap-3 p-3.5 sm:grid-cols-[minmax(0,1fr)_170px] sm:p-4">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold shadow-none ${dealMeta.className}`}>
                      <DealIcon className="mr-1 size-3" />
                      {dealMeta.label}
                    </Badge>
                    <Badge className="rounded-full border border-[#d6eadf] bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#496159] shadow-none">
                      {categoryLabel}
                    </Badge>
                    {pkg.isPopular && (
                      <Badge className="rounded-full border border-[#efcf83] bg-[#fff1cd] px-2 py-0.5 text-[10px] font-extrabold text-[#8b5e12] shadow-none">
                        <TrendingUp className="mr-1 size-3" />
                        Popular
                      </Badge>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-[18px] font-black leading-[1.15] text-[#123021] sm:text-[20px]">
                    {pkg.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[12px] font-semibold leading-5 text-[#647168]">
                    {displayDescription}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#edf1ed] bg-[#fbfaf5] p-3 sm:text-right">
                  <div className="flex items-center gap-1.5 text-[#2d6b4e] sm:justify-end">
                    <PriceIcon className="size-3.5" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#7a9a87]">{priceBlock.label}</p>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[17px] font-black leading-tight text-[#1e3d2e]">
                    {priceBlock.value}
                  </p>
                  {pkg.barterValue && pkg.dealType !== 'barter' && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] font-bold text-[#7a9a87]">{pkg.barterValue}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-[#edf1ed] px-3.5 py-3 sm:px-4">
                <div className="flex flex-wrap gap-1.5">
                  {compactStats.map(({ label, title, Icon }) => (
                    <span key={title} className="inline-flex items-center gap-1 rounded-full bg-[#e8f0ec] px-2 py-1 text-[10px] font-black text-[#2d6b4e]">
                      <Icon className="size-3" />
                      {label} {title}
                    </span>
                  ))}
                  {pkg.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#f4f7f5] px-2 py-1 text-[10px] font-bold text-[#647168]">
                      {tag}
                    </span>
                  ))}
                  {pkg.tags.length > 3 && (
                    <span className="rounded-full bg-[#f4f7f5] px-2 py-1 text-[10px] font-bold text-[#7a9a87]">
                      +{pkg.tags.length - 3}
                    </span>
                  )}
                </div>

                {visibleDeliverables.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {visibleDeliverables.map((deliverable, index) => (
                      <div key={index} className="flex items-center gap-2 text-[11px] font-semibold text-[#496159]">
                        <CheckCircle className="size-3 shrink-0 text-[#2d6b4e]" />
                        <span className="line-clamp-1">{deliverable}</span>
                      </div>
                    ))}
                    {extraDeliverables > 0 && (
                      <p className="pl-5 text-[11px] font-black text-[#7a9a87]">
                        +{extraDeliverables} more deliverable{extraDeliverables === 1 ? '' : 's'}
                      </p>
                    )}
                  </div>
                )}

                {(pkg.barterDescription || pkg.creatorExpectations) && (
                  <div className="mt-2 rounded-xl border border-[#efcf83] bg-[#fff9e8] px-3 py-2 text-[11px] font-semibold leading-5 text-[#8b5e12]">
                    {pkg.barterDescription && <p className="line-clamp-1">{pkg.barterDescription}</p>}
                    {pkg.creatorExpectations && (
                      <p className="line-clamp-1">Creator expects: {pkg.creatorExpectations}</p>
                    )}
                  </div>
                )}

                {activeOrder && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-[#efcf83] bg-[#fff9e8] px-3 py-2 text-[11px] font-bold leading-5 text-[#8b5e12]">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      Active {orderStatusLabel(activeOrder.status)} order already exists.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-[#edf1ed] bg-[#fbfaf5] px-3.5 py-3 sm:justify-end sm:px-4">
                {onViewDetails && (
                  <Button
                    variant="outline"
                    onClick={onViewDetails}
                    className="min-h-9 flex-1 rounded-xl border-[#d1ddd6] bg-white px-3 text-[12px] font-extrabold text-[#2d6b4e] hover:bg-[#e8f0ec] hover:text-[#1e3d2e] sm:flex-none"
                  >
                    Details
                  </Button>
                )}
                <Button
                  onClick={activeOrder ? onViewActiveOrder : onOrder}
                  className={cn(
                    "min-h-9 flex-1 rounded-xl px-3 text-[12px] font-extrabold text-white sm:flex-none",
                    activeOrder ? "bg-[#8b5e12] hover:bg-[#70490d]" : "bg-[#2d6b4e] hover:bg-[#1f5239]"
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
