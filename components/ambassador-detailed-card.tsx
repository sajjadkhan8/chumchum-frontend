'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Creator } from '@/types';
import {
  calculateCreatorAmbassadorMetrics,
  AMBASSADOR_TIERS,
  getAmbasadorSuggestions,
} from '@/lib/ambassador-scoring';
import { AmbassadorTierBadge, AmbassadorScoreGauge, AmbassadorScoreBreakdown } from '@/components/ambassador-score-display';
import {
  AmbassadorJourneyTimeline,
  AmbassadorSuggestions,
  AmbassadorPercentileComparison,
} from '@/components/ambassador-insights';
import { cn } from '@/lib/utils';

interface AmbassadorDetailedCardProps {
  creator: Creator;
  className?: string;
  expandedByDefault?: boolean;
}

export function AmbassadorDetailedCard({
  creator,
  className,
  expandedByDefault = false,
}: AmbassadorDetailedCardProps) {
  const metrics = calculateCreatorAmbassadorMetrics(creator);
  const tierInfo = AMBASSADOR_TIERS[metrics.tier];
  const suggestions = getAmbasadorSuggestions(metrics, metrics.tier);

  const isEligibleForAmb = metrics.score.total >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main Score Card */}
      <Card
        className={cn(
          'relative overflow-hidden border-border/50 transition-all',
          isEligibleForAmb && 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5',
          className
        )}
      >
        {/* Glow effect for eligible */}
        {isEligibleForAmb && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 pointer-events-none"
          />
        )}

        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                Ambassador Readiness
                {isEligibleForAmb && (
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Badge className="bg-primary/90 text-primary-foreground">
                      <Zap className="mr-1 h-3 w-3" />
                      Ready!
                    </Badge>
                  </motion.div>
                )}
              </CardTitle>
              <CardDescription>
                Your path to becoming a Platform Ambassador
              </CardDescription>
            </div>
            <AmbassadorTierBadge tier={metrics.tier} showName={false} size="lg" />
          </div>
        </CardHeader>

        <CardContent className="relative space-y-8">
          {/* Score Gauge Section */}
          <div className="flex flex-col items-center">
            <AmbassadorScoreGauge score={metrics.score.total} size="md" animated />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-center"
            >
              <p className="text-lg font-bold text-foreground">{tierInfo.name}</p>
              <p className="text-sm text-muted-foreground">{tierInfo.description}</p>
              {tierInfo.nextMilestone && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-3 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 inline-block"
                >
                  <p className="text-xs font-semibold text-primary">
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
            className="border-t border-border pt-6"
          >
            <h3 className="font-semibold text-sm mb-4">Score Breakdown</h3>
            <AmbassadorScoreBreakdown score={metrics.score} />
          </motion.div>

          {/* Tier Benefits */}
          {tierInfo.benefits.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="border-t border-border pt-6"
            >
              <h3 className="font-semibold text-sm mb-3">Benefits at {tierInfo.name}</h3>
              <ul className="space-y-2">
                {tierInfo.benefits.map((benefit, idx) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    className="flex gap-2 text-sm text-foreground"
                  >
                    <span className="text-primary">✨</span>
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </CardContent>
      </Card>

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
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Your Journey</CardTitle>
          <CardDescription>Key milestones on your ambassador path</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AmbassadorJourneyTimeline metrics={metrics} />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

