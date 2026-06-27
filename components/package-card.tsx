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
  const visibleDeliverables = pkg.deliverables.slice(0, 3);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden rounded-2xl border-2 border-[#dce8e2] bg-white transition-colors duration-200 hover:border-[#2d6b4e]/45',
          className
        )}
        style={{ boxShadow: '0 2px 8px rgba(30,61,46,0.07), 0 1px 2px rgba(30,61,46,0.04)' }}
      >
        <div className="absolute left-0 top-0 h-[3px] w-full rounded-t-2xl bg-gradient-to-r from-[#2d6b4e]/55 via-[#e6aa38]/50 to-transparent" />
        <CardContent className="p-0">
          <div className="border-b border-[#edf1ed] bg-[#fbfaf5] px-4 py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-[17px] font-black leading-snug tracking-tight text-[#123021] sm:text-[18px]">
                  {pkg.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-5 text-[#647168] sm:text-[13px]">
                  {displayDescription}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d6eadf] bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#2d6b4e] shadow-none">
                  <PlatformIconBadge platform={pkg.platform} size="xs" className="border-0 bg-transparent shadow-none" />
                  {platformLabel}
                </span>
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
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative min-h-36 overflow-hidden bg-[#e8f0ec] md:min-h-full">
              <Image
                src={bannerImage}
                alt={pkg.title}
                fill
                sizes="(max-width: 768px) 100vw, 180px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </div>

            <div className="space-y-3 p-4">
              <div className="flex flex-wrap gap-1.5">
                <Badge className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold shadow-none ${dealMeta.className}`}>
                  <DealIcon className="mr-1 size-3" />
                  {dealMeta.label}
                </Badge>
                {compactStats.map(({ label, title, Icon }) => (
                  <span key={title} className="inline-flex items-center gap-1 rounded-full border border-[#edf1ed] bg-[#fbfaf5] px-2 py-0.5 text-[10px] font-extrabold text-[#496159]">
                    <Icon className="size-3 text-[#2d6b4e]" />
                    {label} {title}
                  </span>
                ))}
              </div>

              {visibleDeliverables.length > 0 && (
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {visibleDeliverables.map((deliverable, index) => (
                    <div key={index} className="flex items-start gap-2 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-2.5 py-2 text-[11px]">
                      <CheckCircle className="mt-0.5 size-3 shrink-0 text-[#2d6b4e]" />
                      <span className="line-clamp-2 leading-4 text-[#496159]">{deliverable}</span>
                    </div>
                  ))}
                  {extraDeliverables > 0 && (
                    <div className="flex items-center rounded-xl border border-[#edf1ed] bg-white px-2.5 py-2 text-[11px] font-extrabold text-[#7a9a87]">
                      +{extraDeliverables} more deliverable{extraDeliverables === 1 ? '' : 's'}
                    </div>
                  )}
                </div>
              )}

              {(pkg.tags.length > 0 || pkg.barterDescription || pkg.creatorExpectations) && (
                <div className="flex flex-wrap gap-1.5">
                  {pkg.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#e8f0ec] px-2.5 py-1 text-[10px] font-bold text-[#2d6b4e]">
                      {tag}
                    </span>
                  ))}
                  {pkg.tags.length > 4 && (
                    <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-[10px] font-bold text-[#7a9a87]">
                      +{pkg.tags.length - 4} tags
                    </span>
                  )}
                </div>
              )}

              {(pkg.barterDescription || pkg.creatorExpectations) && (
                <div className="rounded-xl border border-[#efcf83] bg-[#fff9e8] px-3 py-2 text-[11px] leading-5 text-[#8b5e12]">
                  {pkg.barterDescription && <p className="line-clamp-1">{pkg.barterDescription}</p>}
                  {pkg.creatorExpectations && (
                    <p className="line-clamp-1">Creator expects: {pkg.creatorExpectations}</p>
                  )}
                </div>
              )}

              {activeOrder && (
                <div className="flex items-start gap-2 rounded-xl border border-[#efcf83] bg-[#fff9e8] px-3 py-2 text-[11px] font-bold leading-5 text-[#8b5e12]">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    You already have an active {orderStatusLabel(activeOrder.status)} order for this package.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#edf1ed] bg-[#fbfaf5] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {pkg.dealType === 'barter' ? (
                <div className="flex items-center gap-1 text-[#2d6b4e]">
                  <Gift className="size-4" />
                  <span className="text-[14px] font-extrabold">Barter Deal</span>
                </div>
              ) : pkg.dealType === 'hybrid' ? (
                <div>
                  <div className="flex items-center gap-1 text-[#2d6b4e]">
                    <Sparkles className="size-4" />
                    <span className="text-[13px] font-extrabold">Hybrid Deal</span>
                  </div>
                  <p className="text-[16px] font-black text-[#1e3d2e]">
                    {formatPrice(showCashAmount)} + barter
                  </p>
                </div>
              ) : (
                <p className="text-[18px] font-black tracking-tight text-[#1e3d2e]">{formatPrice(pkg.price)}</p>
              )}
              {pkg.barterValue && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#7a9a87]">{pkg.barterValue}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              {onViewDetails && (
                <Button
                  variant="outline"
                  onClick={onViewDetails}
                  className="min-h-10 rounded-xl border-[#d1ddd6] bg-white px-4 text-[12px] font-extrabold text-[#2d6b4e] hover:bg-[#e8f0ec] hover:text-[#1e3d2e]"
                >
                  Details
                </Button>
              )}
              <Button
                onClick={activeOrder ? onViewActiveOrder : onOrder}
                className={cn(
                  "min-h-10 rounded-xl px-4 text-[12px] font-extrabold text-white",
                  activeOrder ? "bg-[#8b5e12] hover:bg-[#70490d]" : "bg-[#2d6b4e] hover:bg-[#1f5239]"
                )}
                disabled={activeOrder ? !onViewActiveOrder : !onOrder}
              >
                {activeOrder ? 'View Order' : 'Order Now'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
