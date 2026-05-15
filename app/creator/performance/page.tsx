"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const rows = [
  {
    package: 'Lahore Food Reel Sprint',
    views: 12800,
    clicks: 1830,
    inquiries: 114,
    conversion: '9.4%',
    completion: '97%',
  },
  {
    package: 'Karachi Cafe Barter Story Pack',
    views: 9300,
    clicks: 1120,
    inquiries: 82,
    conversion: '8.8%',
    completion: '94%',
  },
  {
    package: 'Hybrid Hotel Weekend Coverage',
    views: 5100,
    clicks: 720,
    inquiries: 33,
    conversion: '6.5%',
    completion: '92%',
  },
];

export default function CreatorPerformancePage() {
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
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

