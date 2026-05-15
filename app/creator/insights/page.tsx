"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

export default function CreatorInsightsPage() {
  const packages = useCreatorPackagesStore((state) => state.packages);

  const totals = packages.reduce(
    (acc, item) => {
      acc.views += item.analytics.views;
      acc.clicks += item.analytics.clicks;
      acc.inquiries += item.analytics.inquiries;
      acc.repeatBrands += item.analytics.repeatBrands;
      acc.conversion += item.analytics.conversionRate;
      return acc;
    },
    { views: 0, clicks: 0, inquiries: 0, repeatBrands: 0, conversion: 0 }
  );

  const avgConversion = packages.length ? totals.conversion / packages.length : 0;

  const trendRows = [
    { label: "Package Views", value: totals.views.toLocaleString(), change: "+12.4%" },
    { label: "Inquiries", value: totals.inquiries.toLocaleString(), change: "+8.1%" },
    { label: "Repeat Brands", value: totals.repeatBrands.toString(), change: "+4.0%" },
    { label: "Avg. Conversion", value: `${avgConversion.toFixed(1)}%`, change: "+1.2%" },
  ];

  const monthlyPipeline = [
    { month: "Jan", value: 42 },
    { month: "Feb", value: 51 },
    { month: "Mar", value: 57 },
    { month: "Apr", value: 64 },
    { month: "May", value: 73 },
    { month: "Jun", value: 69 },
  ];

  const topPackages = [...packages]
    .sort((a, b) => b.analytics.conversionRate - a.analytics.conversionRate)
    .slice(0, 3);

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
                <p className="text-2xl font-bold">{item.value}</p>
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
          {topPackages.map((item) => (
            <div key={item.title} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.title}</p>
                <span className="text-xs text-muted-foreground">Conversion {item.analytics.conversionRate}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(item.analytics.conversionRate * 10, 100)}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              {monthlyPipeline.map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-sm bg-primary/15" style={{ height: `${Math.max(point.value, 8)}px` }}>
                    <div className="w-full rounded-sm bg-primary" style={{ height: `${point.value}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{point.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Contribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Instagram",
                score: Math.min(
                  90,
                  Math.round((packages.filter((item) => item.platform === "instagram").length / Math.max(packages.length, 1)) * 100)
                ),
                note: "Highest inquiry conversion",
              },
              {
                label: "TikTok",
                score: Math.min(
                  90,
                  Math.round((packages.filter((item) => item.platform === "tiktok").length / Math.max(packages.length, 1)) * 100)
                ),
                note: "Fastest top-of-funnel growth",
              },
              {
                label: "YouTube",
                score: Math.min(
                  90,
                  Math.round((packages.filter((item) => item.platform === "youtube").length / Math.max(packages.length, 1)) * 100)
                ),
                note: "Strong high-value package intent",
              },
            ].map((platform) => (
              <div key={platform.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{platform.label}</p>
                  <span className="text-xs text-muted-foreground">{platform.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${platform.score}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{platform.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

