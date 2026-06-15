"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Eye,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Zap,
  Package,
} from "lucide-react";
import Link from "next/link";
import { analyticsService, type CreatorInsightsAnalytics } from "@/services/analytics.service";

// ─── constants ────────────────────────────────────────────────────────────────

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

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

const PERIODS = [
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "6m", value: "6m" },
  { label: "1y", value: "1y" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString();
const fmtPct = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
const fmtPlatform = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "Unknown";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  tiktok: "#010101",
  youtube: "#FF0000",
  facebook: "#1877F2",
  twitter: "#1DA1F2",
  snapchat: "#FFFC00",
};

const platformColor = (p: string) =>
  PLATFORM_COLORS[p?.toLowerCase()] ?? "#2d6b4e";

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeading({
  eyebrow,
  title,
  action,
  href,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">
          {title}
        </h2>
      </div>
      {action && href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2d6b4e] hover:underline"
        >
          {action} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function ChangeChip({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        positive
          ? "bg-[#e4f1e8] text-[#2d6b4e]"
          : "bg-[#fce8e6] text-[#b33a30]"
      }`}
    >
      {positive ? (
        <ArrowUp className="size-2.5" />
      ) : (
        <ArrowDown className="size-2.5" />
      )}
      {fmtPct(value)}
    </span>
  );
}

function MetricCard({
  title,
  value,
  change,
  detail,
  icon: Icon,
  accent = false,
  loading = false,
}: {
  title: string;
  value: string;
  change: number;
  detail: string;
  icon: React.ElementType;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[1.35rem] border p-5 ${
        accent
          ? "border-[#2d6b4e] bg-[#2d6b4e] text-white"
          : "border-[#d1ddd6] bg-white text-[#1e3d2e]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-bold ${accent ? "text-[#c2d8cb]" : "text-[#6b7870]"}`}>
          {title}
        </p>
        <span
          className={`grid size-9 place-items-center rounded-xl ${
            accent ? "bg-white/10 text-[#f0c56e]" : "bg-[#e6eceb] text-[#2d6b4e]"
          }`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-[-0.045em]">
        {loading ? <span className="opacity-30">···</span> : value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {!loading && <ChangeChip value={change} />}
        <span className={`text-[11px] font-semibold ${accent ? "text-[#a9c4b3]" : "text-[#87938b]"}`}>
          {detail}
        </span>
      </div>
    </motion.article>
  );
}

function TrendBar({
  points,
  loading,
}: {
  points: { month: string; value: number }[];
  loading: boolean;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);

  if (loading) {
    return (
      <div className="flex h-40 items-end gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full animate-pulse rounded-t-lg bg-[#e6eceb]"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
            <div className="h-3 w-6 animate-pulse rounded bg-[#e6eceb]" />
          </div>
        ))}
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d1ddd6]">
        <BarChart3 className="size-8 text-[#c2d8cb]" />
        <p className="text-sm text-[#87938b]">No trend data yet</p>
      </div>
    );
  }

  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2">
      {points.map((p, i) => {
        const pct = Math.max((p.value / max) * 100, 3);
        return (
          <div key={p.month} className="group flex flex-1 flex-col items-center gap-1.5">
            <div className="relative w-full flex-1 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: "easeOut" }}
                className="w-full rounded-t-lg bg-[#2d6b4e] transition-colors group-hover:bg-[#1f5239]"
              />
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e3d2e] px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                {p.value}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-[#87938b]">{p.month}</span>
          </div>
        );
      })}
    </div>
  );
}

function PlatformRow({
  platform,
  views,
  inquiries,
  packageCount,
  score,
  index,
}: {
  platform: string;
  views: number;
  inquiries: number;
  packageCount: number;
  score: number;
  index: number;
}) {
  const color = platformColor(platform);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-bold text-[#1e3d2e]">
            {fmtPlatform(platform)}
          </span>
        </div>
        <span className="text-xs font-bold text-[#2d6b4e]">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e6eceb]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: index * 0.07 + 0.2, duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] text-[#87938b]">
        {packageCount} pkg · {fmt(views)} views · {fmt(inquiries)} inquiries
      </p>
    </motion.div>
  );
}

function PackageRow({
  title,
  platform,
  views,
  inquiries,
  conversionRate,
  repeatBrands,
  index,
}: {
  title: string;
  platform: string;
  views: number;
  inquiries: number;
  conversionRate: number;
  repeatBrands: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl border border-[#d1ddd6] p-4 transition-colors hover:border-[#2d6b4e]/30 hover:bg-[#f8faf8]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#1e3d2e]">{title}</p>
          <span className="mt-1 inline-block rounded-full bg-[#e6eceb] px-2 py-0.5 text-[10px] font-bold text-[#2d6b4e]">
            {fmtPlatform(platform)}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold tracking-tight text-[#1e3d2e]">
            {conversionRate.toFixed(1)}%
          </p>
          <p className="text-[10px] text-[#87938b]">conversion</p>
        </div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#e6eceb]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(conversionRate * 10, 100)}%` }}
          transition={{ delay: index * 0.07 + 0.25, duration: 0.55, ease: "easeOut" }}
          className="h-full rounded-full bg-[#e6aa38]"
        />
      </div>
      <div className="mt-3 flex gap-4 text-[11px] text-[#87938b]">
        <span><span className="font-bold text-[#1e3d2e]">{fmt(views)}</span> views</span>
        <span><span className="font-bold text-[#1e3d2e]">{fmt(inquiries)}</span> inquiries</span>
        <span><span className="font-bold text-[#1e3d2e]">{repeatBrands}</span> repeat brands</span>
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CreatorInsightsPage() {
  const [insights, setInsights] = useState<CreatorInsightsAnalytics>(emptyInsights);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("6m");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    analyticsService
      .getCreatorInsights(period)
      .then((data) => { if (!cancelled) { setInsights(data); setIsLoading(false); } })
      .catch(() => { if (!cancelled) { setInsights(emptyInsights); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, [period]);

  const { totals } = insights;

  const metrics = [
    {
      title: "Package Views",
      value: fmt(totals.packageViews),
      change: totals.packageViewsChange,
      detail: "total impressions",
      icon: Eye,
      accent: true,
    },
    {
      title: "Inquiries",
      value: fmt(totals.inquiries),
      change: totals.inquiriesChange,
      detail: "brand inquiries",
      icon: MessageSquare,
    },
    {
      title: "Repeat Brands",
      value: totals.repeatBrands.toString(),
      change: totals.repeatBrandsChange,
      detail: "returning clients",
      icon: RefreshCw,
    },
    {
      title: "Avg. Conversion",
      value: `${totals.avgConversionRate.toFixed(1)}%`,
      change: totals.avgConversionChange,
      detail: "view-to-inquiry rate",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-5">

        {/* ── Period selector ── */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1 rounded-2xl border border-[#d1ddd6] bg-white p-1 shadow-sm">
            {PERIODS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200 ${
                  period === value
                    ? "bg-[#2d6b4e] text-white shadow-sm"
                    : "text-[#6b7870] hover:text-[#1e3d2e]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Metric cards ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div key={m.title} transition={{ delay: i * 0.06 }}>
              <MetricCard {...m} loading={isLoading} />
            </motion.div>
          ))}
        </div>

        {/* ── Inquiry trend (full width) ── */}
        <section className={`${panelClass} p-5 sm:p-6`}>
          <SectionHeading eyebrow="Over time" title="Inquiry trend" />
          <div className="mt-6 px-1">
            <TrendBar points={insights.monthlyInquiryTrend} loading={isLoading} />
          </div>
        </section>

        {/* ── Platform + Top packages ── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">

          {/* Platform contribution */}
          <section className={`${panelClass} p-5 sm:p-6`}>
            <SectionHeading eyebrow="By channel" title="Platform breakdown" />
            <div className="mt-5 space-y-5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#e6eceb]" />
                      <div className="h-4 w-10 animate-pulse rounded bg-[#e6eceb]" />
                    </div>
                    <div className="h-1.5 w-full animate-pulse rounded-full bg-[#e6eceb]" />
                    <div className="h-3 w-40 animate-pulse rounded bg-[#e6eceb]" />
                  </div>
                ))
              ) : insights.platformContribution.length > 0 ? (
                insights.platformContribution.map((p, i) => (
                  <PlatformRow
                    key={p.platform}
                    platform={p.platform}
                    views={p.views}
                    inquiries={p.inquiries}
                    packageCount={p.packageCount}
                    score={p.score}
                    index={i}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#d1ddd6] py-10">
                  <Zap className="size-7 text-[#c2d8cb]" />
                  <p className="text-sm text-[#87938b]">No platform data yet</p>
                </div>
              )}
            </div>
          </section>

          {/* Top packages */}
          <section className={`${panelClass} p-5 sm:p-6`}>
            <SectionHeading
              eyebrow="Best performers"
              title="Top packages"
              action="All packages"
              href="/creator/packages"
            />
            <div className="mt-5 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-[#d1ddd6] p-4 space-y-3">
                    <div className="h-4 w-48 animate-pulse rounded bg-[#e6eceb]" />
                    <div className="h-3 w-16 animate-pulse rounded bg-[#e6eceb]" />
                    <div className="h-1 w-full animate-pulse rounded-full bg-[#e6eceb]" />
                  </div>
                ))
              ) : insights.topPackages.length > 0 ? (
                insights.topPackages.map((pkg, i) => (
                  <PackageRow
                    key={pkg.packageId}
                    title={pkg.title}
                    platform={pkg.platform}
                    views={pkg.views}
                    inquiries={pkg.inquiries}
                    conversionRate={pkg.conversionRate}
                    repeatBrands={pkg.repeatBrands}
                    index={i}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#d1ddd6] py-10">
                  <Package className="size-7 text-[#c2d8cb]" />
                  <p className="text-sm text-[#87938b]">No package data yet</p>
                  <Link
                    href="/creator/packages/new"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#2d6b4e] hover:underline"
                  >
                    Create your first package <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
