"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreatorPackagesStore } from "@/store/creator-packages-store";

export default function CreatorPerformancePage() {
  const packages = useCreatorPackagesStore((state) => state.packages);

  const rows = packages
    .map((item) => ({
      package: item.title,
      views: item.analytics.views,
      clicks: item.analytics.clicks,
      inquiries: item.analytics.inquiries,
      conversion: `${item.analytics.conversionRate}%`,
      completion: `${item.analytics.completionRate}%`,
      repeat: item.analytics.repeatBrands,
    }))
    .sort((a, b) => parseFloat(b.conversion) - parseFloat(a.conversion));

  return (
    <div className="space-y-6 p-1">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Package Performance</h1>
        <p className="text-muted-foreground">Compare package efficiency across views, clicks, and conversion outcomes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => (
            <div key={row.package} className="rounded-lg border border-border/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{row.package}</p>
                <Badge variant="outline">Completion {row.completion}</Badge>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-4">
                <p>Views: {row.views.toLocaleString()}</p>
                <p>Clicks: {row.clicks.toLocaleString()}</p>
                <p>Inquiries: {row.inquiries}</p>
                <p>Conversion: {row.conversion}</p>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <p>Repeat Brands: {row.repeat}</p>
                <p>CTR: {row.views > 0 ? ((row.clicks / row.views) * 100).toFixed(1) : "0.0"}%</p>
                <p>Inquiry-to-Click: {row.clicks > 0 ? ((row.inquiries / row.clicks) * 100).toFixed(1) : "0.0"}%</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Package Efficiency Meter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => {
            const score = Math.min(
              100,
              Math.round((parseFloat(row.conversion) * 6) + (parseFloat(row.completion) * 0.4))
            );

            return (
              <div key={`${row.package}-meter`} className="space-y-1 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{row.package}</p>
                  <span className="text-xs text-muted-foreground">Efficiency {score}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
