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
                'h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold',
                milestone.completed
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {milestone.completed ? <Check className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </motion.div>
            {idx < milestones.length - 1 && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 48 }}
                transition={{ delay: idx * 0.15 + 0.2 }}
                className={cn(
                  'w-0.5 my-1',
                  milestones[idx + 1].completed ? 'bg-primary/30' : 'bg-muted/30'
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
              <p className="font-semibold text-sm">{milestone.title}</p>
              {milestone.date && (
                <p className="text-xs text-muted-foreground">
                  {milestone.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {!milestone.completed && !milestone.date && (
                <p className="text-xs text-muted-foreground italic">
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
    <div className="space-y-6">
      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-primary/20 bg-primary/5 p-4"
        >
          <h4 className="font-semibold text-sm mb-3 text-primary">
            🎯 How to Level Up Faster
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <motion.li
                key={suggestion}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-2 text-sm text-foreground"
              >
                <span className="text-primary">→</span>
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
          className="rounded-lg border border-green-500/20 bg-green-500/5 p-4"
        >
          <h4 className="font-semibold text-sm mb-3 text-green-700 dark:text-green-400">
            ✨ Your Strengths
          </h4>
          <ul className="space-y-1">
            {strengths.map((strength) => (
              <li key={strength} className="flex gap-2 text-sm text-foreground">
                <span className="text-green-600">✓</span>
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
          className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <h4 className="font-semibold text-sm mb-3 text-amber-700 dark:text-amber-400">
            📈 Areas to Improve
          </h4>
          <ul className="space-y-1">
            {improvements.map((improvement) => (
              <li key={improvement} className="flex gap-2 text-sm text-foreground">
                <span className="text-amber-600">•</span>
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
      className="rounded-lg border border-border/50 bg-muted/30 p-6 text-center"
    >
      <div className="space-y-3">
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-primary"
          >
            {percentile}%
          </motion.div>
          <p className="text-sm text-muted-foreground">
            You're ahead of {percentile}% of creators
          </p>
        </div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4 }}
          className="origin-left"
        >
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </motion.div>

        <p className="text-sm font-medium text-foreground">
          In the top {percentile >= 90 ? '10%' : percentile >= 75 ? '25%' : percentile >= 50 ? '50%' : 'growing'} of {tierName}
        </p>

        {percentile >= 90 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            🌟 You're eligible for Elite tier soon!
          </p>
        )}
      </div>
    </motion.div>
  );
}

