'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { CreatorAmbassadorMetrics } from '@/types';
import {
  AMBASSADOR_TIERS,
  getAmbassadorSuggestions,
} from '@/lib/ambassador-scoring';
import { AmbassadorTierBadge, AmbassadorScoreGauge, AmbassadorScoreBreakdown } from '@/components/ambassador-score-display';
import {
  AmbassadorJourneyTimeline,
  AmbassadorSuggestions,
  AmbassadorPercentileComparison,
} from '@/components/ambassador-insights';
import { cn } from '@/lib/utils';

const panelClass =
  'rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6';

interface AmbassadorDetailedCardProps {
  metrics: CreatorAmbassadorMetrics;
  className?: string;
}

export function AmbassadorDetailedCard({
  metrics,
  className,
}: AmbassadorDetailedCardProps) {
  const tierInfo = AMBASSADOR_TIERS[metrics.tier];
  const suggestions = getAmbassadorSuggestions(metrics.score.total, metrics.tier, metrics.improvements);

  const isEligibleForAmb = metrics.score.total >= 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Score Card */}
      <div
        className={cn(
          'relative overflow-hidden',
          panelClass,
          isEligibleForAmb && 'border-[#c2dac9] bg-[#f0f9f4]',
          className
        )}
      >
        {/* Glow effect for eligible */}
        {isEligibleForAmb && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#2d6b4e]/0 via-[#2d6b4e]/5 to-[#2d6b4e]/0"
          />
        )}

        <div className="relative">
          {/* Header row */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Score</p>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
                  Ambassador Readiness
                </h2>
                {isEligibleForAmb && (
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2d6b4e] px-2.5 py-1 text-[10px] font-extrabold text-white"
                  >
                    <Zap className="size-3" />
                    Ready!
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-[#87938b]">Your path to becoming a Platform Ambassador</p>
            </div>
            <AmbassadorTierBadge tier={metrics.tier} showName={false} size="lg" />
          </div>

          {/* Score Gauge Section */}
          <div className="flex flex-col items-center">
            <AmbassadorScoreGauge score={metrics.score.total} size="md" animated />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-lg font-extrabold text-[#1e3d2e]">{tierInfo.name}</p>
              <p className="text-sm text-[#87938b]">{tierInfo.description}</p>
              {tierInfo.nextMilestone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-3 inline-block rounded-xl border border-[#c2dac9] bg-[#e4f1e8] px-4 py-2"
                >
                  <p className="text-xs font-bold text-[#2d6b4e]">
                    {tierInfo.nextMilestone - metrics.score.total} points to next tier
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Score Breakdown */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 border-t border-[#d1ddd6] pt-6"
          >
            <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">
              Score Breakdown
            </h3>
            <AmbassadorScoreBreakdown score={metrics.score} />
          </motion.div>

          {/* Tier Benefits */}
          {tierInfo.benefits.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 border-t border-[#d1ddd6] pt-6"
            >
              <h3 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-[#7a8f82]">
                Benefits at {tierInfo.name}
              </h3>
              <ul className="space-y-2">
                {tierInfo.benefits.map((benefit, idx) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    className="flex gap-2 text-sm text-[#1e3d2e]"
                  >
                    <span className="text-[#2d6b4e]">✨</span>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Percentile Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AmbassadorPercentileComparison percentile={metrics.percentileRank} tierName={tierInfo.name} />
      </motion.div>

      {/* Insights and Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AmbassadorSuggestions
          suggestions={suggestions}
          strengths={metrics.strengths}
          improvements={metrics.improvements}
        />
      </motion.div>

      {/* Journey Timeline */}
      <div className={panelClass}>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Milestones</p>
        <h2 className="mb-5 mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">Your Journey</h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AmbassadorJourneyTimeline metrics={metrics} />
        </motion.div>
      </div>
    </motion.div>
  );
}
