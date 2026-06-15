'use client';

import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import type { CreatorAmbassadorMetrics } from '@/types';
import { cn } from '@/lib/utils';

interface AmbassadorJourneyTimelineProps {
  metrics: CreatorAmbassadorMetrics;
}

export function AmbassadorJourneyTimeline({ metrics }: AmbassadorJourneyTimelineProps) {
  const milestones = [
    {
      title: 'Joined Platform',
      date: metrics.journeyMilestones.joinedPlatform,
      completed: true,
      icon: '🎯',
    },
    {
      title: 'First Delivery',
      date: metrics.journeyMilestones.firstDelivery,
      completed: !!metrics.journeyMilestones.firstDelivery,
      icon: '🚀',
    },
    {
      title: 'Consistency Achieved',
      date: metrics.journeyMilestones.consistencyAchieved,
      completed: !!metrics.journeyMilestones.consistencyAchieved,
      icon: '⭐',
    },
    {
      title: 'Ambassador Eligible',
      date: metrics.journeyMilestones.ambassadorEligible,
      completed: !!metrics.journeyMilestones.ambassadorEligible,
      icon: '👑',
    },
  ];

  return (
    <div className="space-y-6">
      {milestones.map((milestone, idx) => (
        <motion.div
          key={milestone.title}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.15 }}
          className="flex gap-4"
        >
          {/* Timeline node */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.15 + 0.1 }}
              className={cn(
                'flex size-10 items-center justify-center rounded-full font-bold text-lg',
                milestone.completed
                  ? 'bg-[#e4f1e8] text-[#2d6b4e]'
                  : 'bg-[#f0f0ec] text-[#87938b]'
              )}
            >
              {milestone.completed ? <Check className="size-5" /> : <Lock className="size-5" />}
            </motion.div>
            {idx < milestones.length - 1 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 48 }}
                transition={{ delay: idx * 0.15 + 0.2 }}
                className={cn(
                  'my-1 w-0.5',
                  milestones[idx + 1].completed ? 'bg-[#c2dac9]' : 'bg-[#e0e9e3]'
                )}
              />
            )}
          </div>

          {/* Milestone info */}
          <div className="flex-1 pt-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.15 + 0.2 }}
            >
              <p className="text-sm font-semibold text-[#1e3d2e]">{milestone.title}</p>
              {milestone.date && (
                <p className="text-xs text-[#87938b]">
                  {milestone.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {!milestone.completed && !milestone.date && (
                <p className="text-xs italic text-[#87938b]">
                  Complete previous milestones to unlock
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface AmbassadorSuggestionsProps {
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

export function AmbassadorSuggestions({
  suggestions,
  strengths,
  improvements,
}: AmbassadorSuggestionsProps) {
  return (
    <div className="space-y-4">
      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[1.4rem] border border-[#c2dac9] bg-[#f0f9f4] p-4"
        >
          <h4 className="mb-3 text-sm font-extrabold text-[#2d6b4e]">
            🎯 How to Level Up Faster
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <motion.li
                key={suggestion}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-2 text-sm text-[#1e3d2e]"
              >
                <span className="text-[#2d6b4e]">→</span>
                <span>{suggestion}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* What You're Doing Well */}
      {strengths.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[1.4rem] border border-[#c2dac9] bg-[#f0f9f4] p-4"
        >
          <h4 className="mb-3 text-sm font-extrabold text-[#2d6b4e]">
            ✨ Your Strengths
          </h4>
          <ul className="space-y-1">
            {strengths.map((strength) => (
              <li key={strength} className="flex gap-2 text-sm text-[#1e3d2e]">
                <span className="text-[#2d6b4e]">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Areas to Improve */}
      {improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[1.4rem] border border-[#e8c98a] bg-[#fdf3dc] p-4"
        >
          <h4 className="mb-3 text-sm font-extrabold text-[#73541e]">
            📈 Areas to Improve
          </h4>
          <ul className="space-y-1">
            {improvements.map((improvement) => (
              <li key={improvement} className="flex gap-2 text-sm text-[#1e3d2e]">
                <span className="text-[#9b6712]">•</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

interface AmbassadorPercentileProps {
  percentile: number;
  tierName: string;
}

export function AmbassadorPercentileComparison({
  percentile,
  tierName,
}: AmbassadorPercentileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[1.6rem] border border-[#d1ddd6] bg-[#f4f7f5] p-6 text-center shadow-[0_8px_28px_rgba(38,70,50,0.05)]"
    >
      <div className="space-y-3">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-extrabold text-[#2d6b4e]"
          >
            {percentile}%
          </motion.div>
          <p className="text-sm text-[#87938b]">
            You're ahead of {percentile}% of creators
          </p>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
          className="origin-left"
        >
          <div className="h-2 overflow-hidden rounded-full bg-[#e0e9e3]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2d6b4e] to-[#3d9e71]"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </motion.div>

        <p className="text-sm font-bold text-[#1e3d2e]">
          In the top {percentile >= 90 ? '10%' : percentile >= 75 ? '25%' : percentile >= 50 ? '50%' : 'growing'} of {tierName}
        </p>

        {percentile >= 90 && (
          <p className="text-xs font-semibold text-[#9b6712]">
            🌟 You're eligible for Elite tier soon!
          </p>
        )}
      </div>
    </motion.div>
  );
}
