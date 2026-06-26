'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileCheck2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Users,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CreatorMetricCard } from '@/components/creator-metric-card';
import { adminService, type AdminDashboard, type AdminOrder, type AdminSLAMetrics } from '@/services/admin.service';
import { formatPrice, getInitials } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';
import { useAuthStore } from '@/store/auth-store';

/* ── compact PKR abbreviation ── */
function abbrevPKR(v: number): string {
  if (v >= 1_000_000) return `Rs ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rs ${(v / 1_000).toFixed(0)}k`;
  return `Rs ${Math.round(v)}`;
}

/* ── order status chip ── */
function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; Icon: React.ElementType }> = {
    completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  Icon: CheckCircle2 },
    in_progress: { label: 'In Progress', cls: 'bg-sky-50    text-sky-700    border-sky-200',        Icon: Clock },
    delivered:   { label: 'Delivered',   cls: 'bg-violet-50 text-violet-700 border-violet-200',     Icon: TrendingUp },
    review:      { label: 'In Review',   cls: 'bg-amber-50  text-amber-700  border-amber-200',      Icon: AlertCircle },
    revision:    { label: 'Revision',    cls: 'bg-orange-50 text-orange-700 border-orange-200',     Icon: AlertCircle },
    pending:     { label: 'Pending',     cls: 'bg-slate-50  text-slate-600  border-slate-200',      Icon: Clock },
    accepted:    { label: 'Accepted',    cls: 'bg-blue-50   text-blue-700   border-blue-200',       Icon: CheckCircle2 },
    cancelled:   { label: 'Cancelled',   cls: 'bg-red-50    text-red-600    border-red-200',        Icon: AlertCircle },
  };
  const { label, cls, Icon } = cfg[status] ?? { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200', Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

/* ── quick action tile ── */
function QuickTile({ label, copy, href, Icon }: { label: string; copy: string; href: string; Icon: React.ElementType }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[#dde5df] bg-[#f9faf8] p-3.5 transition-all duration-200 hover:border-[#2d6b4e] hover:bg-white hover:shadow-md"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e] transition-colors group-hover:bg-[#2d6b4e] group-hover:text-white">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] font-extrabold text-[#1e3d2e]">{label}</span>
        <span className="block text-[11px] text-[#87938b]">{copy}</span>
      </div>
      <ArrowRight className="size-3.5 shrink-0 text-[#b5c0bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#2d6b4e]" />
    </Link>
  );
}

/* ── platform metric bar ── */
function PlatformBar({ label, value, max, copy }: { label: string; value: number; max: number; copy: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="font-semibold text-[#496159]">{label}</span>
        <span className="font-bold text-[#1e3d2e]">{copy}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5eae4]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2d6b4e] to-[#2d6b4ecc] transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const emptyDashboard: AdminDashboard = {
  users: { total: 0, creators: 0, brands: 0, admins: 0, active: 0, inactive: 0 },
  orders: { total: 0, byStatus: {} },
  revenue: { completedOrderAmount: 0, gmv: 0 },
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<AdminDashboard>(emptyDashboard);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<AdminSLAMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [dash, ordersRes, sla] = await Promise.all([
        adminService.getDashboard().catch(() => emptyDashboard),
        adminService.getOrders({ limit: 5 }).catch(() => ({ orders: [], total: 0, page: 0, limit: 5 })),
        adminService.getSLAMetrics().catch(() => null),
      ]);
      setDashboard(dash);
      setRecentOrders(ordersRes.orders.slice(0, 5));
      setSlaMetrics(sla);
      setLoading(false);
    };
    void load();
  }, []);

  const activeOrders = ['accepted', 'in_progress', 'delivered', 'review', 'revision'].reduce(
    (sum, s) => sum + (dashboard.orders.byStatus[s] || 0),
    0,
  );

  // Spark arrays intentionally omitted — no time-series endpoint yet; trend arrows would be fabricated.

  const quickActions = [
    { label: 'User Moderation',  copy: 'Review flagged accounts',   href: '/admin/user-moderation',  Icon: ShieldAlert },
    { label: 'Verification',     copy: 'Creator & brand queue',      href: '/admin/verification',     Icon: FileCheck2 },
    { label: 'Orders',           copy: 'Manage all orders',          href: '/admin/orders',           Icon: ShoppingBag },
    { label: 'Payments',         copy: 'Transactions & payouts',     href: '/admin/payments',         Icon: CreditCard },
    { label: 'Disputes',         copy: 'Resolve open cases',         href: '/admin/disputes',         Icon: Scale },
    { label: 'Payments Audit',   copy: 'Compliance & reconciliation',href: '/admin/payments-audit',   Icon: ShieldCheck },
  ];

  const statusOrder = ['pending', 'accepted', 'in_progress', 'delivered', 'review', 'revision', 'completed', 'cancelled'];
  const statusEntries = statusOrder
    .map((s) => [s, dashboard.orders.byStatus[s] || 0] as [string, number])
    .filter(([, count]) => count > 0);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
          <p className="text-sm text-[#87938b]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── metric cards ── */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Platform metrics">
        <CreatorMetricCard
          dark
          title="Total Users"
          animatedValue={dashboard.users.total}
          sub={`${dashboard.users.active} active · ${dashboard.users.inactive} inactive`}
          Icon={Users}
          aria-label={`Total users: ${dashboard.users.total}`}
        />
        <CreatorMetricCard
          title="Active Orders"
          animatedValue={activeOrders}
          sub={`${dashboard.orders.total} total orders`}
          Icon={ShoppingBag}
          aria-label={`Active orders: ${activeOrders}`}
        />
        <CreatorMetricCard
          title="Platform GMV"
          animatedValue={dashboard.revenue.gmv ?? dashboard.revenue.completedOrderAmount}
          fmt={abbrevPKR}
          sub={`${abbrevPKR(dashboard.revenue.completedOrderAmount)} completed`}
          Icon={DollarSign}
          aria-label={`Platform GMV: ${abbrevPKR(dashboard.revenue.gmv ?? dashboard.revenue.completedOrderAmount)}`}
        />
        <CreatorMetricCard
          title="Creators"
          animatedValue={dashboard.users.creators}
          sub={`${dashboard.users.brands} brands · ${dashboard.users.admins} admins`}
          Icon={FileCheck2}
          aria-label={`Creators: ${dashboard.users.creators}`}
        />
      </section>

      {/* ── main layout ── */}
      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">

        {/* left col */}
        <div className="space-y-4">

          {/* ── hero operations card ── */}
          <section className="relative overflow-hidden rounded-2xl bg-[#1e3d2e] p-5 text-white sm:p-6">
            {/* ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#2d6b4e] opacity-40 blur-3xl" />
              <div className="absolute -bottom-12 -left-12 size-48 rounded-full bg-[#e6aa38] opacity-10 blur-3xl" />
            </div>

            <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                    <Activity className="size-3" />
                    Platform Operations
                  </span>
                  <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] font-bold text-white/50">
                    Admin Console
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">
                  Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.
                </h2>
                <p className="mt-2 max-w-md text-[13px] leading-6 text-white/50">
                  {activeOrders > 0
                    ? `${activeOrders} orders are currently active on the platform. Monitor moderation, payments, and disputes from the sidebar.`
                    : 'No active orders right now. Review verification queues, user moderation, and platform health below.'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/admin/user-moderation"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#e6aa38] px-4 text-[12px] font-extrabold text-[#1e3d2e] transition hover:bg-[#f0bd58]"
                  >
                    User Moderation <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link
                    href="/admin/disputes"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-4 text-[12px] font-semibold text-white/80 transition hover:bg-white/12"
                  >
                    Open Disputes
                  </Link>
                </div>
              </div>

              {/* platform summary pills */}
              <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                {[
                  { label: 'Users',    val: dashboard.users.total.toLocaleString() },
                  { label: 'Orders',   val: dashboard.orders.total.toLocaleString() },
                  { label: 'Revenue',  val: abbrevPKR(dashboard.revenue.completedOrderAmount) },
                ].map(({ label, val }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-white">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── recent orders ── */}
          <section className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Latest activity</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Recent Orders</h2>
              </div>
              <Link href="/admin/orders" className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2d6b4e] transition hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-[#f4f6f4]">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-[#fafcfa]">
                    <Avatar className="size-9 shrink-0 border border-[#e2e7e1]">
                      <AvatarFallback className="bg-[#e8f0ec] text-[11px] font-bold text-[#2d6b4e]">
                        {getInitials(order.brandName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold text-[#1e3d2e]">{order.brandName}</p>
                      <p className="truncate text-[11px] text-[#87938b]">{order.packageTitle} · {order.creatorName}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {order.amount != null && order.amount > 0 && (
                        <p className="text-[13px] font-extrabold text-[#1e3d2e]">{formatPrice(order.amount)}</p>
                      )}
                      <StatusChip status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                  <ShoppingBag className="size-5 text-[#2d6b4e]" />
                </span>
                <p className="text-sm font-extrabold text-[#1e3d2e]">No orders yet</p>
                <p className="text-[11px] text-[#87938b]">Orders will appear here once brands start commissioning creators.</p>
              </div>
            )}
          </section>

          {/* ── quick actions ── */}
          <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Jump to</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Quick Actions</h2>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {quickActions.map((a) => (
                <QuickTile key={a.href} {...a} />
              ))}
            </div>
          </section>

          {/* SLA & Compliance */}
          <section className="mt-6">
            <h2 className="mb-4 text-lg font-extrabold text-[#173b2a]">SLA & Compliance</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: 'Avg dispute resolution',
                  value: slaMetrics ? `${slaMetrics.avgDisputeResolutionDays.toFixed(1)}d` : '—',
                  icon: Scale,
                  color: 'text-[#8b5e12]',
                  bg: 'bg-[#fff1cd]',
                },
                {
                  label: 'Withdrawals < 24h',
                  value: slaMetrics ? `${Math.round(slaMetrics.withdrawalsProcessedWithin24hPct)}%` : '—',
                  icon: TrendingUp,
                  color: slaMetrics && slaMetrics.withdrawalsProcessedWithin24hPct >= 80 ? 'text-[#185c39]' : 'text-[#c0392b]',
                  bg: slaMetrics && slaMetrics.withdrawalsProcessedWithin24hPct >= 80 ? 'bg-[#e7f0ea]' : 'bg-[#fde8e8]',
                },
                {
                  label: 'Orders on time',
                  value: slaMetrics ? `${Math.round(slaMetrics.ordersCompletedOnTimePct)}%` : '—',
                  icon: CheckCircle2,
                  color: slaMetrics && slaMetrics.ordersCompletedOnTimePct >= 80 ? 'text-[#185c39]' : 'text-[#c0392b]',
                  bg: slaMetrics && slaMetrics.ordersCompletedOnTimePct >= 80 ? 'bg-[#e7f0ea]' : 'bg-[#fde8e8]',
                },
                {
                  label: 'Creator verifications pending',
                  value: slaMetrics ? String(slaMetrics.pendingCreatorVerifications) : '—',
                  icon: ShieldAlert,
                  color: 'text-[#185c39]',
                  bg: 'bg-[#e7f0ea]',
                },
                {
                  label: 'Brand verifications pending',
                  value: slaMetrics ? String(slaMetrics.pendingBrandVerifications) : '—',
                  icon: FileCheck2,
                  color: 'text-[#185c39]',
                  bg: 'bg-[#e7f0ea]',
                },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.35rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_8px_30px_rgba(38,70,50,0.06)]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b867f]">{item.label}</p>
                    <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${item.bg}`}>
                      <item.icon className={`size-4 ${item.color}`} />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#173b2a]">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* right sidebar */}
        <aside className="space-y-4">

          {/* ── user breakdown ── */}
          <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">User base</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Breakdown</h2>
              </div>
              <span className="grid size-8 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
                <BarChart3 className="size-4" />
              </span>
            </div>
            <div className="space-y-4">
              <PlatformBar
                label="Creators"
                value={dashboard.users.creators}
                max={dashboard.users.total}
                copy={`${dashboard.users.creators} / ${dashboard.users.total}`}
              />
              <PlatformBar
                label="Brands"
                value={dashboard.users.brands}
                max={dashboard.users.total}
                copy={`${dashboard.users.brands} / ${dashboard.users.total}`}
              />
              <PlatformBar
                label="Active accounts"
                value={dashboard.users.active}
                max={dashboard.users.total}
                copy={`${dashboard.users.active} / ${dashboard.users.total}`}
              />
            </div>
            <Link
              href="/admin/users"
              className="mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-[#d1ddd6] bg-[#f9faf8] py-2.5 text-[12px] font-extrabold text-[#2d6b4e] transition hover:bg-[#e8f0ec]"
            >
              View all users <ArrowRight className="size-3.5" />
            </Link>
          </section>

          {/* ── order status ── */}
          <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Live pipeline</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Order Status</h2>
            </div>
            {statusEntries.length > 0 ? (
              <div className="space-y-2">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3.5 py-2.5">
                    <span className="text-[12px] font-semibold capitalize text-[#496159]">{status.replace('_', ' ')}</span>
                    <span className="text-[14px] font-extrabold text-[#1e3d2e]">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#d1ddd6] py-6 text-center text-[11px] text-[#87938b]">
                No orders yet
              </div>
            )}
            <Link
              href="/admin/orders"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[#d1ddd6] bg-[#f9faf8] py-2.5 text-[12px] font-extrabold text-[#2d6b4e] transition hover:bg-[#e8f0ec]"
            >
              Manage orders <ArrowRight className="size-3.5" />
            </Link>
          </section>

          {/* ── orders by category ── */}
          {(dashboard.ordersByCategory?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Completed orders</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">By Category</h2>
              </div>
              <dl className="space-y-2">
                {dashboard.ordersByCategory!.map(({ category, count }) => (
                  <div key={category} className="flex items-center justify-between rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3.5 py-2.5">
                    <dt className="text-[12px] font-semibold text-[#496159]">{getCategoryLabel(category)}</dt>
                    <dd className="text-[14px] font-extrabold text-[#1e3d2e]">{count.toString()}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* ── platform health ── */}
          <section className="rounded-2xl border border-[#e2e7e1] bg-white p-5 shadow-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Platform health</p>
            <div className="space-y-3">
              {[
                { label: 'Total orders',    val: dashboard.orders.total.toString(),                              Icon: ShoppingBag },
                { label: 'Active orders',   val: activeOrders.toString(),                                       Icon: Activity },
                { label: 'Completed rev.',  val: abbrevPKR(dashboard.revenue.completedOrderAmount),              Icon: DollarSign },
                { label: 'Inactive users',  val: dashboard.users.inactive.toString(),                           Icon: ShieldAlert },
              ].map(({ label, val, Icon }) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#e8f0ec] text-[#2d6b4e]">
                      <Icon className="size-3.5" />
                    </span>
                    <span className="text-[12px] text-[#496159]">{label}</span>
                  </div>
                  <span className="text-[13px] font-extrabold text-[#1e3d2e]">{val}</span>
                </div>
              ))}
            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}
