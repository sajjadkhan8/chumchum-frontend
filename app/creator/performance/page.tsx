"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { analyticsService, type CreatorPerformanceAnalytics } from "@/services/analytics.service";

const emptyPerformance: CreatorPerformanceAnalytics = {
  packages: [],
};

export default function CreatorPerformancePage() {
  const [performance, setPerformance] = useState<CreatorPerformanceAnalytics>(emptyPerformance);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
      setIsLoading(true);
      const data = await analyticsService.getCreatorPerformance().catch(() => emptyPerformance);
      setPerformance(data);
      setIsLoading(false);
    };

    void loadPerformance();
  }, []);

  const rows = performance.packages
    .map((item) => ({
      id: item.packageId,
      package: item.title,
      views: item.views,
      clicks: item.clicks,
      inquiries: item.inquiries,
      conversion: `${item.conversionRate}%`,
      completion: `${item.completionRate}%`,
      repeat: item.repeatBrands,
      ctr: item.ctr,
      inquiryToClickRate: item.inquiryToClickRate,
      efficiencyScore: item.efficiencyScore,
    }))
    .sort((a, b) => parseFloat(b.conversion) - parseFloat(a.conversion));

  return (
    <div className="container mx-auto p-4 pb-6 md:p-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Package Performance</h1>
        <p className="text-muted-foreground">Compare package efficiency across views, clicks, and conversion outcomes.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length > 0 ? rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border/60 p-3">
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
                <p>CTR: {row.ctr.toFixed(1)}%</p>
                <p>Inquiry-to-Click: {row.inquiryToClickRate.toFixed(1)}%</p>
              </div>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {isLoading ? "Loading package performance..." : "No package performance data yet."}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Package Efficiency Meter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((row) => {
            return (
              <div key={`${row.id}-meter`} className="space-y-1 rounded-lg border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{row.package}</p>
                  <span className="text-xs text-muted-foreground">Efficiency {row.efficiencyScore}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${row.efficiencyScore}%` }} />
                </div>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Efficiency scores will appear once your packages have analytics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
