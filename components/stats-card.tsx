'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  icon?: LucideIcon;
  change?: number;
  trend?: 'up' | 'down' | {
    value: number;
    isPositive: boolean;
  };
  action?: ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  subtitle,
  icon: Icon,
  change,
  trend,
  action,
  className,
}: StatsCardProps) {
  const normalizedTrend = typeof trend === 'string'
    ? typeof change === 'number'
      ? {
          value: Math.abs(change),
          isPositive: trend === 'up',
        }
      : undefined
    : trend ?? (typeof change === 'number'
      ? {
          value: Math.abs(change),
          isPositive: change >= 0,
        }
      : undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('overflow-hidden rounded-2xl', className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {(description || subtitle) && (
                <p className="text-xs text-muted-foreground">{description || subtitle}</p>
              )}
              {normalizedTrend && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    normalizedTrend.isPositive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-destructive/10 text-destructive'
                  )}
                >
                  {normalizedTrend.isPositive ? '+' : '-'}{Math.abs(normalizedTrend.value)}%
                  <span className="text-muted-foreground">vs last month</span>
                </div>
              )}
              {action && <div className="pt-2">{action}</div>}
            </div>
            {Icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
