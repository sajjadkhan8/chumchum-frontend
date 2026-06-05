"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Target, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { formatPrice } from "@/lib/utils";
import { analyticsService, type BrandCampaignAnalytics } from "@/services/analytics.service";

const emptyAnalytics: BrandCampaignAnalytics = {
  totalReach: 0,
  avgEngagementRate: 0,
  creatorsActive: 0,
  monthlySpend: 0,
  totalOrders: 0,
  completedOrders: 0,
  topCities: [],
  dealMix: {
    paid: 0,
    hybrid: 0,
    barter: 0,
  },
};

const formatCompactNumber = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

const formatLabel = (value: string) => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export default function BrandAnalyticsPage() {
  const [analytics, setAnalytics] = useState<BrandCampaignAnalytics>(emptyAnalytics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      const data = await analyticsService.getBrandCampaigns().catch(() => emptyAnalytics);
      setAnalytics(data);
      setIsLoading(false);
    };

    void loadAnalytics();
  }, []);

  const totalDealCount = analytics.dealMix.paid + analytics.dealMix.hybrid + analytics.dealMix.barter;
  const dealRows = [
    { label: "Paid", value: analytics.dealMix.paid },
    { label: "Hybrid", value: analytics.dealMix.hybrid },
    { label: "Barter", value: analytics.dealMix.barter },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Campaign Analytics</h1>
        <p className="text-muted-foreground">Track campaign performance across paid, barter, and hybrid deals.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Reach" value={isLoading ? "..." : formatCompactNumber(analytics.totalReach)} icon={TrendingUp} />
        <StatsCard title="Avg Engagement" value={isLoading ? "..." : `${analytics.avgEngagementRate.toFixed(1)}%`} icon={Target} />
        <StatsCard title="Creators Active" value={isLoading ? "..." : analytics.creatorsActive.toString()} icon={Users} />
        <StatsCard title="Monthly Spend" value={isLoading ? "..." : formatPrice(analytics.monthlySpend)} icon={Wallet} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {analytics.topCities.length > 0 ? analytics.topCities.map((item) => (
              <div key={item.city} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">{formatLabel(item.city)}</p>
                  <span>{item.share.toFixed(1)}%</span>
                </div>
                <p>{item.orders} orders from creators in this city</p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                City distribution will appear after you place creator orders.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deal Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {totalDealCount > 0 ? dealRows.map((item) => {
              const share = (item.value / totalDealCount) * 100;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{item.label}</p>
                    <span>{share.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                  <p>{item.value} orders</p>
                </div>
              );
            }) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                Deal mix will appear after campaign orders are created.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
