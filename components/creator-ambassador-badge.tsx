'use client';

import { motion } from 'framer-motion';
import { Zap, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Creator } from '@/types';
import { calculateAmbassadorScore, getAmbassadorTier, AMBASSADOR_TIERS } from '@/lib/ambassador-scoring';
import { cn } from '@/lib/utils';

interface CreatorAmbassadorBadgeProps {
  creator: Creator;
  showScore?: boolean;
  className?: string;
  showNewIndicator?: boolean;
}

/**
 * Small, elegant ambassador badge for creator cards
 * Shows tier and optionally the score
 */
export function CreatorAmbassadorBadge({
  creator,
  showScore = false,
  className,
  showNewIndicator = true,
}: CreatorAmbassadorBadgeProps) {
  const score = calculateAmbassadorScore(creator);
  const tier = getAmbassadorTier(score.total);
  const tierInfo = AMBASSADOR_TIERS[tier];

  // Only show if score is above 40 (at least Emerging)
  if (score.total < 40) return null;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      {/* Glow effect for high tiers */}
      {score.total >= 70 && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -inset-1 rounded-full blur-md"
          style={{
            background: `${tierInfo.color}40`,
          }}
        />
      )}

      <Badge
        className="relative gap-1 px-2 py-0.5 text-xs"
        style={{
          background: `${tierInfo.color}15`,
          border: `1px solid ${tierInfo.color}`,
          color: tierInfo.color,
        }}
      >
        <span>{tierInfo.icon}</span>
        <span className="font-semibold">{tierInfo.tier.split('_')[0]}</span>
        {showNewIndicator && score.total >= 70 && (
          <span className="rounded-full bg-foreground/10 px-1 py-[1px] text-[9px] font-semibold uppercase tracking-wide">
            New
          </span>
        )}
        {showScore && (
          <span className="ml-1 opacity-70">({score.total})</span>
        )}
        {score.total >= 70 && (
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="ml-1"
          >
            <Zap className="h-3 w-3 fill-current" />
          </motion.div>
        )}
      </Badge>
    </motion.div>
  );
}

interface CreatorAmbassadorStatsProps {
  creator: Creator;
  variant?: 'compact' | 'full';
}

/**
 * Mini stats showing ambassador score and tier
 * Used in creator profiles or detailed views
 */
export function CreatorAmbassadorStats({
  creator,
  variant = 'compact',
}: CreatorAmbassadorStatsProps) {
  const score = calculateAmbassadorScore(creator);
  const tier = getAmbassadorTier(score.total);
  const tierInfo = AMBASSADOR_TIERS[tier];

  if (score.total < 40) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      {variant === 'compact' ? (
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <div className="font-semibold text-foreground">{tierInfo.name}</div>
            <div className="text-xs text-muted-foreground">Score: {score.total}/100</div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{tierInfo.name}</span>
            <span className="text-lg font-bold text-primary">{score.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((score.total / 100) * 100, 100)}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {score.total >= 70 ? '✨ Eligible for ambassador perks' : `${70 - score.total} points to unlock`}
          </p>
        </div>
      )}
    </motion.div>
  );
}

