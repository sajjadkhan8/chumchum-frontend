"use client";

import { ArrowUpRight, BarChart3, Eye, MessageCircle, Repeat, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const trendRows = [
  { label: 'Package Views', value: '42.8K', change: '+12.4%' },
  { label: 'Inquiries', value: '386', change: '+8.1%' },
  { label: 'Repeat Brands', value: '19', change: '+4.0%' },
  { label: 'Avg. Conversion', value: '8.7%', change: '+1.2%' },
];

export default function CreatorInsightsPage() {
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
          {[
            { title: 'Lahore Food Reel Sprint', score: 92, metric: 'Conversion 9.4%' },
            { title: 'Karachi Cafe Barter Story Pack', score: 81, metric: 'Inquiries +18%' },
            { title: 'Hybrid Hotel Weekend Coverage', score: 74, metric: 'Click-through +11%' },
          ].map((item) => (
            <div key={item.title} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.title}</p>
                <span className="text-xs text-muted-foreground">{item.metric}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

