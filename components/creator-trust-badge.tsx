import { Award, BadgeCheck, Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CreatorBadgeLevel } from '@/types';

const badgeConfig = {
  verified: {
    label: 'Verified',
    description: 'Identity verified creator',
    icon: BadgeCheck,
    className: 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
  },
  rising_star: {
    label: 'Rising Star',
    description: 'Fast-growing creator with strong early performance',
    icon: Sparkles,
    className: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  },
  pro: {
    label: 'Pro',
    description: 'Experienced creator with a proven delivery record',
    icon: Award,
    className: 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200',
  },
  elite: {
    label: 'Elite',
    description: 'Top-tier creator recognized for exceptional performance',
    icon: Crown,
    className: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
  },
} as const;

interface CreatorTrustBadgeProps {
  level?: CreatorBadgeLevel;
  isVerified?: boolean;
  compact?: boolean;
  className?: string;
}

export function getCreatorTrustLabel(level?: CreatorBadgeLevel, isVerified?: boolean) {
  const effectiveLevel = level && level !== 'none' ? level : isVerified ? 'verified' : 'none';
  return effectiveLevel === 'none' ? 'Not yet verified' : badgeConfig[effectiveLevel].label;
}

export function CreatorTrustBadge({ level, isVerified, compact = false, className }: CreatorTrustBadgeProps) {
  const effectiveLevel = level && level !== 'none' ? level : isVerified ? 'verified' : 'none';
  if (effectiveLevel === 'none') return null;

  const config = badgeConfig[effectiveLevel];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      title={config.description}
      aria-label={config.description}
      className={cn('gap-1 whitespace-nowrap font-semibold', compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs', config.className, className)}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </Badge>
  );
}
