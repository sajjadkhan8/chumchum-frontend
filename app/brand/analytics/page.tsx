'use client';

import { useEffect, useState } from 'react';
import { Award, CheckCircle2, RefreshCw, Star, Target, TrendingUp, Users, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsCard } from '@/components/stats-card';
import { formatPrice, getInitials } from '@/lib/utils';
import {
  analyticsService,
  type BrandCampaignAnalytics,
  type BrandExtendedAnalytics,
} from '@/services/analytics.service';

const PERIODS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

export default function BrandAnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState<BrandCampaignAnalytics | null>(null);
  const [extended, setExtended] = useState<BrandExtendedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const load = async (p: string) => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [a, e] = await Promise.all([
        analyticsService.getBrandCampaigns(p),
        analyticsService.getBrandExtended(p),
      ]);
      setAnalytics(a);
      setExtended(e);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(period); }, [period]);

  if (hasError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-extrabold text-[#173b2a]">Could not load analytics</p>
        <button onClick={() => void load(period)} className="rounded-full bg-[#185c39] px-5 py-2.5 text-sm font-bold text-white">
          Retry
        </button>
      </div>
    );
  }

  const dealMix = analytics?.dealMix;
  const completionPct = analytics?.totalOrders
    ? Math.round(((analytics.completedOrders ?? 0) / analytics.totalOrders) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-8 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#173b2a]">Campaign Analytics</h1>
          <p className="text-sm text-[#647168]">Performance overview across all campaigns</p>
          <p className="mt-1 text-[11px] font-semibold text-[#8a7a49]">
            Data source: derived from campaign orders, creator reactions, reviews, and payment totals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <button
            onClick={() => void load(period)}
            className="grid size-9 place-items-center rounded-xl border border-[#d9e0d8] bg-white text-[#647168] hover:bg-[#f4f2e9]"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Primary KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : (
            <>
              <StatsCard title="Total reach" value={(analytics?.totalReach ?? 0).toLocaleString()} icon={Users} />
              <StatsCard title="Avg engagement" value={`${(analytics?.avgEngagementRate ?? 0).toFixed(1)}%`} icon={TrendingUp} />
              <StatsCard title="Active creators" value={String(analytics?.creatorsActive ?? 0)} icon={Target} />
              <StatsCard title="Monthly spend" value={formatPrice(analytics?.monthlySpend ?? 0)} icon={Wallet} />
            </>
          )}
      </div>

      {/* Extended KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'On-time delivery',
            value: isLoading ? '—' : `${Math.round(extended?.onTimeDeliveryPct ?? 0)}%`,
            icon: CheckCircle2,
            good: (extended?.onTimeDeliveryPct ?? 0) >= 80,
          },
          {
            label: 'Repeat creator rate',
            value: isLoading ? '—' : `${Math.round(extended?.repeatCreatorRate ?? 0)}%`,
            icon: RefreshCw,
            good: (extended?.repeatCreatorRate ?? 0) >= 30,
          },
          {
            label: 'Total orders',
            value: isLoading ? '—' : String(analytics?.totalOrders ?? 0),
            icon: Award,
            good: true,
          },
          {
            label: 'Completion rate',
            value: isLoading ? '—' : analytics?.totalOrders ? `${completionPct}%` : '—',
            icon: Star,
            good: completionPct >= 80,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#d9e0d8] bg-white p-4 shadow-[0_4px_20px_rgba(38,70,50,0.05)]"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-[#7b867f]">{card.label}</p>
              <span className={`grid size-8 place-items-center rounded-xl ${card.good ? 'bg-[#e7f0ea] text-[#185c39]' : 'bg-red-50 text-red-500'}`}>
                <card.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-[#173b2a]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top Creators by Spend */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Creators by Spend</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : (extended?.topCreatorsBySpend ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No spend data yet.</p>
            ) : (
              <div className="space-y-2">
                {(extended?.topCreatorsBySpend ?? []).slice(0, 10).map((c, i) => (
                  <div key={c.creatorId} className="flex items-center gap-3 rounded-xl bg-[#fbfaf5] p-3">
                    <span className="w-5 text-xs font-extrabold text-[#9ba8a1]">{i + 1}</span>
                    <Avatar className="size-9 border border-white shadow-sm">
                      <AvatarImage src={c.creatorAvatar} alt={c.creatorName} />
                      <AvatarFallback>{getInitials(c.creatorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[#173b2a]">{c.creatorName}</p>
                      <p className="text-xs text-[#9ba8a1]">{c.completedOrders}/{c.orderCount} completed</p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-[#185c39]">{formatPrice(c.totalSpend)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Completion Rates */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Completion Rate by Campaign</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (extended?.campaignCompletionRates ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns with order data yet.</p>
            ) : (
              <div className="space-y-3">
                {(extended?.campaignCompletionRates ?? []).map((c) => (
                  <div key={c.campaignId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <p className="truncate font-extrabold text-[#173b2a]">{c.campaignTitle}</p>
                      <span className={`ml-3 shrink-0 font-bold ${c.completionRate >= 80 ? 'text-[#185c39]' : c.completionRate >= 50 ? 'text-[#8b5e12]' : 'text-red-600'}`}>
                        {Math.round(c.completionRate)}%
                      </span>
                    </div>
                    <Progress value={c.completionRate} className="h-2 bg-[#e6eceb]" />
                    <p className="mt-1 text-xs text-[#9ba8a1]">{c.completedOrders} of {c.totalOrders} completed</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Top Cities</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
            ) : (analytics?.topCities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No city data yet.</p>
            ) : (
              <div className="space-y-3">
                {(analytics?.topCities ?? []).map((city) => (
                  <div key={city.city}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-extrabold text-[#173b2a]">{city.city}</span>
                      <span className="font-bold text-[#185c39]">{city.orders} orders · {city.share}%</span>
                    </div>
                    <Progress value={city.share} className="mt-1.5 h-2 bg-[#e6eceb]" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deal Mix & ROI */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Deal Mix & ROI Estimates</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !dealMix ? (
              <p className="text-sm text-muted-foreground">No deal data yet.</p>
            ) : (
              <div className="space-y-3">
                {(['paid', 'barter', 'hybrid'] as const).map((type) => {
                  const total = (dealMix.paid ?? 0) + (dealMix.barter ?? 0) + (dealMix.hybrid ?? 0);
                  const count = dealMix[type] ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const roi = extended?.dealTypeROI[type];
                  return (
                    <div key={type} className="rounded-xl bg-[#fbfaf5] p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold capitalize text-[#173b2a]">{type}</span>
                        <span className="text-sm font-bold text-[#185c39]">{count} orders · {pct}%</span>
                      </div>
                      <Progress value={pct} className="mt-2 h-1.5 bg-[#e6eceb]" />
                      {roi && roi.totalSpend > 0 ? (
                        <div className="mt-2 flex gap-4 text-xs text-[#9ba8a1]">
                          <span>Spend: {formatPrice(roi.totalSpend)}</span>
                          {roi.avgEngagement > 0 && <span>Avg engagement: {roi.avgEngagement.toFixed(1)}%</span>}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
