'use client';

import { motion } from 'framer-motion';
import { AMBASSADOR_TIERS } from '@/lib/ambassador-scoring';
import type { AmbassadorTier } from '@/types';
import { cn } from '@/lib/utils';

interface AmbassadorTierBadgeProps {
  tier: AmbassadorTier;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AmbassadorTierBadge({
  tier,
  showName = true,
  size = 'md',
  className,
}: AmbassadorTierBadgeProps) {
  const tierInfo = AMBASSADOR_TIERS[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        sizeClasses[size],
        className
      )}
      style={{
        background: `${tierInfo.color}15`,
        border: `1.5px solid ${tierInfo.color}`,
        color: tierInfo.color,
      }}
    >
      <span>{tierInfo.icon}</span>
      {showName && <span>{tierInfo.name}</span>}
    </motion.div>
  );
}

interface AmbassadorScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

export function AmbassadorScoreGauge({
  score,
  size = 'md',
  showLabel = true,
  animated = true,
}: AmbassadorScoreGaugeProps) {
  const sizeConfig = {
    sm: { radius: 40, circumference: 2 * Math.PI * 40, width: 80, strokeWidth: 4 },
    md: { radius: 55, circumference: 2 * Math.PI * 55, width: 120, strokeWidth: 5 },
    lg: { radius: 70, circumference: 2 * Math.PI * 70, width: 160, strokeWidth: 6 },
  };

  const config = sizeConfig[size];
  const offset = config.circumference - (score / 100) * config.circumference;

  let strokeColor = '#84cc16';
  if (score >= 40 && score < 60) strokeColor = '#3b82f6';
  if (score >= 60 && score < 80) strokeColor = '#f59e0b';
  if (score >= 80) strokeColor = '#8b5cf6';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          width={config.width}
          height={config.width}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke="#e0e9e3"
            strokeWidth={config.strokeWidth}
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={config.radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={config.strokeWidth}
            strokeDasharray={config.circumference}
            strokeDashoffset={animated ? config.circumference : offset}
            strokeLinecap="round"
            animate={animated ? { strokeDashoffset: offset } : {}}
            transition={animated ? { duration: 1.5, ease: 'easeInOut' } : {}}
          />
        </svg>

        {/* Score text in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={animated ? { opacity: 0, scale: 0.8 } : {}}
            animate={animated ? { opacity: 1, scale: 1 } : {}}
            transition={animated ? { delay: 0.5 } : {}}
            className="text-center"
          >
            <div
              className="font-bold"
              style={{
                fontSize: size === 'sm' ? '20px' : size === 'md' ? '28px' : '36px',
                color: strokeColor,
              }}
            >
              {Math.round(score)}
            </div>
            <div className="text-xs text-[#87938b]">/ 100</div>
          </motion.div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={animated ? { opacity: 0 } : {}}
          animate={animated ? { opacity: 1 } : {}}
          transition={animated ? { delay: 0.8 } : {}}
          className="text-center"
        >
          <div className="text-xs font-medium text-[#87938b]">
            Ambassador Readiness Score
          </div>
        </motion.div>
      )}
    </div>
  );
}

interface ScoreBreakdownProps {
  score: {
    total: number;
    deliveryScore: number;
    accountAgeScore: number;
    ratingScore: number;
    cancellationScore: number;
    profileCompletenessScore: number;
    consistencyScore: number;
  };
}

export function AmbassadorScoreBreakdown({ score }: ScoreBreakdownProps) {
  const componentScores = [
    { label: 'Delivery Track Record', value: score.deliveryScore, max: 25 },
    { label: 'Account Stability', value: score.accountAgeScore, max: 15 },
    { label: 'Quality & Rating', value: score.ratingScore, max: 25 },
    { label: 'Cancellation Rate', value: score.cancellationScore, max: 10 },
    { label: 'Profile Completeness', value: score.profileCompletenessScore, max: 10 },
    { label: 'Consistency', value: score.consistencyScore, max: 5 },
  ];

  return (
    <div className="space-y-4">
      {componentScores.map((component, idx) => (
        <motion.div
          key={component.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-[#1e3d2e]">{component.label}</span>
            <span className="text-xs font-semibold text-[#2d6b4e]">
              {component.value}/{component.max}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e0e9e3]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(component.value / component.max) * 100}%` }}
              transition={{ delay: idx * 0.1 + 0.3, duration: 0.6 }}
              className="h-full rounded-full bg-gradient-to-r from-[#2d6b4e] to-[#3d9e71]"
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
