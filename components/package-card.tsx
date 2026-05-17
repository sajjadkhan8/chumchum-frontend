'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, Gift, Sparkles, TrendingUp, Instagram, Youtube } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Package } from '@/types';
import { cn, formatPrice } from '@/lib/utils';

interface PackageCardProps {
  pkg: Package;
  onOrder?: () => void;
  className?: string;
}

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const platformIcons: Record<string, React.ElementType> = {
  instagram: Instagram,
  tiktok: TikTokIcon,
  youtube: Youtube,
};

export function PackageCard({ pkg, onOrder, className }: PackageCardProps) {
  const PlatformIcon = platformIcons[pkg.platform] || Instagram;
  const showCashAmount = pkg.dealType === 'paid' ? pkg.price : pkg.hybridCashAmount || pkg.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('overflow-hidden rounded-2xl border-primary/10', className)}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <PlatformIcon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium capitalize">{pkg.platform}</span>
            </div>
            {pkg.isPopular && (
              <Badge className="bg-accent text-accent-foreground">
                <TrendingUp className="mr-1 h-3 w-3" />
                Popular
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="space-y-4 p-4">
            <div>
              <h3 className="font-semibold text-foreground">{pkg.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{pkg.description}</p>
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              {pkg.deliverables.slice(0, 4).map((deliverable, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{deliverable}</span>
                </div>
              ))}
              {pkg.deliverables.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{pkg.deliverables.length - 4} more deliverables
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {pkg.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Delivery Time */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{pkg.deliveryDays} days delivery</span>
            </div>

            {(pkg.barterDescription || pkg.creatorExpectations) && (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-3 text-xs text-muted-foreground">
                {pkg.barterDescription && <p>{pkg.barterDescription}</p>}
                {pkg.creatorExpectations && (
                  <p className="mt-1">Creator expects: {pkg.creatorExpectations}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5 p-4">
            <div>
              {pkg.dealType === 'barter' ? (
                <div className="flex items-center gap-1 text-primary">
                  <Gift className="h-4 w-4" />
                  <span className="font-semibold">Barter Deal</span>
                </div>
              ) : pkg.dealType === 'hybrid' ? (
                <div>
                  <div className="flex items-center gap-1 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Hybrid Deal</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(showCashAmount)} + barter
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-foreground">{formatPrice(pkg.price)}</p>
              )}
              {pkg.barterValue && (
                <p className="text-xs text-muted-foreground">{pkg.barterValue}</p>
              )}
              {pkg.estimatedBarterValue ? (
                <p className="text-xs text-muted-foreground">Estimated value: {formatPrice(pkg.estimatedBarterValue)}</p>
              ) : null}
            </div>
            <Button onClick={onOrder} className="rounded-full shadow-sm" disabled={!onOrder}>
              Order Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
