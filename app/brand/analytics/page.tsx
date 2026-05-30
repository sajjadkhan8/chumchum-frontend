"use client";

import { TrendingUp, Target, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/stats-card";
import { formatPrice } from "@/lib/utils";

export default function BrandAnalyticsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Campaign Analytics</h1>
        <p className="text-muted-foreground">Track campaign performance across paid, barter, and hybrid deals.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Reach" value="12.4M" icon={TrendingUp} />
        <StatsCard title="Avg Engagement" value="5.8%" icon={Target} />
        <StatsCard title="Creators Active" value="32" icon={Users} />
        <StatsCard title="Monthly Spend" value={formatPrice(945000)} icon={Wallet} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Karachi: 34% campaign reach</p>
            <p>Lahore: 29% campaign reach</p>
            <p>Islamabad: 18% campaign reach</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deal Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Paid: 52%</p>
            <p>Hybrid: 33%</p>
            <p>Barter: 15%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

