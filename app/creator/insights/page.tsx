"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyticsService, type CreatorInsightsAnalytics } from "@/services/analytics.service";

const emptyInsights: CreatorInsightsAnalytics = {
  totals: {
    packageViews: 0,
    packageViewsChange: 0,
    inquiries: 0,
    inquiriesChange: 0,
    repeatBrands: 0,
    repeatBrandsChange: 0,
    avgConversionRate: 0,
    avgConversionChange: 0,
  },
  monthlyInquiryTrend: [],
  platformContribution: [],
  topPackages: [],
};

const formatChange = (value: number) => {
  if (value === 0) return "0.0%";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
};

const formatPlatform = (platform: string) => {
  if (!platform) return "Unknown";
  return platform.charAt(0).toUpperCase() + platform.slice(1).toLowerCase();
};

export default function CreatorInsightsPage() {
  const [insights, setInsights] = useState<CreatorInsightsAnalytics>(emptyInsights);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      setIsLoading(true);
      const data = await analyticsService.getCreatorInsights().catch(() => emptyInsights);
      setInsights(data);
      setIsLoading(false);
    };

    void loadInsights();
  }, []);

  const { totals } = insights;

  const trendRows = [
    { label: "Package Views", value: totals.packageViews.toLocaleString(), change: formatChange(totals.packageViewsChange) },
    { label: "Inquiries", value: totals.inquiries.toLocaleString(), change: formatChange(totals.inquiriesChange) },
    { label: "Repeat Brands", value: totals.repeatBrands.toString(), change: formatChange(totals.repeatBrandsChange) },
    { label: "Avg. Conversion", value: `${totals.avgConversionRate.toFixed(1)}%`, change: formatChange(totals.avgConversionChange) },
  ];

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Creator Insights</h1>
        <p className="text-muted-foreground">Track package funnel health and identify top-performing offers.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trendRows.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{isLoading ? "..." : item.value}</p>
                <Badge variant="secondary" className="bg-primary/10 text-primary">{item.change}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Package Trends</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.topPackages.length > 0 ? insights.topPackages.map((item) => (
            <div key={item.title} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.title}</p>
                <span className="text-xs text-muted-foreground">Conversion {item.conversionRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.conversionRate * 10, 100)}%` }} />
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No package analytics yet. Package performance will appear after your offers receive traffic.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.monthlyInquiryTrend.length > 0 ? (
              <div className="flex items-end gap-2">
                {insights.monthlyInquiryTrend.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-sm bg-primary/15" style={{ height: `${Math.max(point.value, 8)}px` }}>
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${point.value}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{point.month}</span>
                </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Monthly inquiry history is not available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Contribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.platformContribution.length > 0 ? insights.platformContribution.map((platform) => (
              <div key={platform.platform} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{formatPlatform(platform.platform)}</p>
                  <span className="text-xs text-muted-foreground">{platform.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${platform.score}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {platform.packageCount} packages · {platform.views.toLocaleString()} views · {platform.inquiries.toLocaleString()} inquiries
                </p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Platform contribution will appear after package analytics are recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
