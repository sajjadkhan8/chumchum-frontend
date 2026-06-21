'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Gift, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Package } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { getPlatformIcon } from '@/components/platform-icons';

interface PackageCardProps {
  pkg: Package;
  onOrder?: () => void;
  className?: string;
}

export function PackageCard({ pkg, onOrder, className }: PackageCardProps) {
  const PlatformIcon = getPlatformIcon(pkg.platform);
  const showCashAmount = pkg.dealType === 'paid' ? pkg.price : pkg.hybridCashAmount || pkg.price;
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
          <div className="flex items-start justify-between gap-3 border-b border-[#edf1ed] bg-[#fbfaf5] px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
                <PlatformIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold capitalize text-[#1e3d2e]">{pkg.platform}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">
                  {pkg.deliveryDays} days delivery
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <Badge className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold shadow-none ${dealMeta.className}`}>
                <DealIcon className="mr-1 size-3" />
                {dealMeta.label}
              </Badge>
              {pkg.isPopular && (
                <Badge className="rounded-full border border-[#efcf83] bg-[#fff1cd] px-2 py-0.5 text-[10px] font-extrabold text-[#8b5e12] shadow-none">
                  <TrendingUp className="mr-1 size-3" />
                  Popular
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug tracking-tight text-[#1e3d2e]">{pkg.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#647168]">{pkg.description}</p>
            </div>

            <div className="grid gap-2">
              {pkg.deliverables.slice(0, 4).map((deliverable, index) => (
                <div key={index} className="flex items-start gap-2 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2 text-[12px]">
                  <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-[#2d6b4e]" />
                  <span className="leading-5 text-[#496159]">{deliverable}</span>
                </div>
              ))}
              {pkg.deliverables.length > 4 && (
                <p className="pl-1 text-[11px] font-semibold text-[#7a9a87]">
                  +{pkg.deliverables.length - 4} more deliverables
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {pkg.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#e8f0ec] px-2.5 py-1 text-[10px] font-bold text-[#2d6b4e]">
                  {tag}
                </span>
              ))}
            </div>

            {(pkg.barterDescription || pkg.creatorExpectations) && (
              <div className="rounded-xl border border-[#efcf83] bg-[#fff9e8] p-3 text-[12px] leading-5 text-[#8b5e12]">
                {pkg.barterDescription && <p>{pkg.barterDescription}</p>}
                {pkg.creatorExpectations && (
                  <p className="mt-1">Creator expects: {pkg.creatorExpectations}</p>
                )}
              </div>
            )}
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
              {pkg.estimatedBarterValue ? (
                <p className="mt-0.5 text-[11px] font-semibold text-[#7a9a87]">Estimated value: {formatPrice(pkg.estimatedBarterValue)}</p>
              ) : null}
            </div>
            <Button
              onClick={onOrder}
              className="min-h-10 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-extrabold text-white hover:bg-[#1f5239]"
              disabled={!onOrder}
            >
              Order Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
