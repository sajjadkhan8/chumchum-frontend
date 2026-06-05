'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DollarSign, FileCheck2, RefreshCw, ShoppingBag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/stats-card';
import { adminService, type AdminDashboard } from '@/services/admin.service';
import { formatPrice } from '@/lib/utils';

const emptyDashboard: AdminDashboard = {
  users: { total: 0, creators: 0, brands: 0, admins: 0, active: 0, inactive: 0 },
  orders: { total: 0, byStatus: {} },
  revenue: { completedOrderAmount: 0 },
};

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      setDashboard(await adminService.getDashboard());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const activeOrders = ['accepted', 'in_progress', 'delivered', 'review', 'revision'].reduce(
    (total, status) => total + (dashboard.orders.byStatus[status] || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform health, moderation, and operational controls.</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Users" value={isLoading ? '...' : dashboard.users.total} subtitle={`${dashboard.users.active} active`} icon={Users} />
        <StatsCard title="Creators" value={isLoading ? '...' : dashboard.users.creators} subtitle={`${dashboard.users.brands} brands`} icon={FileCheck2} />
        <StatsCard title="Orders" value={isLoading ? '...' : dashboard.orders.total} subtitle={`${activeOrders} active`} icon={ShoppingBag} />
        <StatsCard title="Completed Revenue" value={isLoading ? '...' : formatPrice(dashboard.revenue.completedOrderAmount)} icon={DollarSign} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboard.orders.byStatus)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm capitalize">{status.replaceAll('_', ' ')}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              {!isLoading && Object.values(dashboard.orders.byStatus).every((count) => count === 0) && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No orders have been created yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Workbench</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="min-h-11 justify-start gap-2">
              <Link href="/admin/users">
                <Users className="h-4 w-4" />
                Moderate Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 justify-start gap-2">
              <Link href="/admin/orders">
                <ShoppingBag className="h-4 w-4" />
                Review Orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11 justify-start gap-2 sm:col-span-2">
              <Link href="/admin/verification">
                <FileCheck2 className="h-4 w-4" />
                Verification Queue
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
