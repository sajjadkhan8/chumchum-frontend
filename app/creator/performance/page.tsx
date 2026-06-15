"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Eye,
  MessageSquare,
  MousePointerClick,
  Package,
  RefreshCw,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { analyticsService, type CreatorPerformanceAnalytics } from "@/services/analytics.service";

// ─── constants ────────────────────────────────────────────────────────────────

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const emptyPerformance: CreatorPerformanceAnalytics = { packages: [] };

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

type EfficiencyTier = "excellent" | "good" | "fair" | "low";

function efficiencyTier(score: number): EfficiencyTier {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "low";
}

const TIER_CONFIG: Record<EfficiencyTier, { label: string; color: string; bg: string; text: string }> = {
  excellent: { label: "Excellent", color: "#2d6b4e", bg: "#e4f1e8", text: "#1e5c3e" },
  good:      { label: "Good",      color: "#e6aa38", bg: "#fdf3dc", text: "#8a6010" },
  fair:      { label: "Fair",      color: "#e07b2a", bg: "#fde8d5", text: "#8a4a10" },
  low:       { label: "Low",       color: "#c0392b", bg: "#fce8e6", text: "#8b2a22" },
};

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

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  accent = false,
  loading = false,
}: {
  title: string;
  value: string;
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
      <p className={`mt-1.5 text-[11px] font-semibold ${accent ? "text-[#a9c4b3]" : "text-[#87938b]"}`}>
        {detail}
      </p>
    </motion.article>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f4f7f5] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#87938b]">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold text-[#1e3d2e]">{value}</p>
    </div>
  );
}

function PackageCard({
  pkg,
  rank,
  index,
}: {
  pkg: CreatorPerformanceAnalytics["packages"][number];
  rank: number;
  index: number;
}) {
  const tier = efficiencyTier(pkg.efficiencyScore);
  const cfg = TIER_CONFIG[tier];

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`${panelClass} overflow-hidden`}
    >
      {/* header strip */}
      <div className="flex items-start justify-between gap-4 border-b border-[#e8eeeb] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#e6eceb] text-xs font-extrabold text-[#2d6b4e]">
            #{rank}
          </span>
          <p className="truncate text-sm font-extrabold text-[#1e3d2e]">{pkg.title}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold"
          style={{ background: cfg.bg, color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>

      {/* stat groups */}
      <div className="grid gap-px bg-[#e8eeeb] sm:grid-cols-3">
        {/* reach */}
        <div className="space-y-2 bg-white p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#87938b]">
            <Eye className="size-3" /> Reach
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-2">
            <StatPill label="Views" value={fmt(pkg.views)} />
            <StatPill label="Clicks" value={fmt(pkg.clicks)} />
            <StatPill label="CTR" value={fmtPct(pkg.ctr)} />
          </div>
        </div>

        {/* engagement */}
        <div className="space-y-2 bg-white p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#87938b]">
            <MessageSquare className="size-3" /> Engagement
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-2">
            <StatPill label="Inquiries" value={fmt(pkg.inquiries)} />
            <StatPill label="Conversion" value={fmtPct(pkg.conversionRate)} />
            <StatPill label="Inq / Click" value={fmtPct(pkg.inquiryToClickRate)} />
          </div>
        </div>

        {/* loyalty */}
        <div className="space-y-2 bg-white p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#87938b]">
            <RefreshCw className="size-3" /> Loyalty
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2">
            <StatPill label="Completion" value={fmtPct(pkg.completionRate)} />
            <StatPill label="Repeat Brands" value={pkg.repeatBrands.toString()} />
          </div>
        </div>
      </div>

      {/* efficiency bar */}
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="flex items-center gap-1.5 text-[#87938b]">
            <Zap className="size-3" /> Efficiency score
          </span>
          <span style={{ color: cfg.color }}>{pkg.efficiencyScore}/100</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e6eceb]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pkg.efficiencyScore}%` }}
            transition={{ delay: index * 0.07 + 0.3, duration: 0.7, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
        </div>
      </div>
    </motion.article>
  );
}

function EfficiencyRankRow({
  pkg,
  rank,
  maxScore,
  index,
}: {
  pkg: CreatorPerformanceAnalytics["packages"][number];
  rank: number;
  maxScore: number;
  index: number;
}) {
  const tier = efficiencyTier(pkg.efficiencyScore);
  const cfg = TIER_CONFIG[tier];
  const pct = maxScore > 0 ? (pkg.efficiencyScore / maxScore) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-2.5">
        <span className="w-5 shrink-0 text-right text-[10px] font-extrabold text-[#87938b]">
          {rank}
        </span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-[#1e3d2e]">
          {pkg.title}
        </p>
        <span
          className="shrink-0 text-xs font-extrabold"
          style={{ color: cfg.color }}
        >
          {pkg.efficiencyScore}
        </span>
      </div>
      <div className="ml-7 h-1.5 w-full overflow-hidden rounded-full bg-[#e6eceb]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: cfg.color }}
        />
      </div>
    </motion.div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function CreatorPerformancePage() {
  const [performance, setPerformance] = useState<CreatorPerformanceAnalytics>(emptyPerformance);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    analyticsService
      .getCreatorPerformance()
      .then((data) => { if (!cancelled) { setPerformance(data); setIsLoading(false); } })
      .catch(() => { if (!cancelled) { setPerformance(emptyPerformance); setIsLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const sorted = useMemo(
    () => [...performance.packages].sort((a, b) => b.efficiencyScore - a.efficiencyScore),
    [performance.packages]
  );

  const maxScore = sorted[0]?.efficiencyScore ?? 100;

  const totals = useMemo(() => {
    const pkgs = performance.packages;
    return {
      views: pkgs.reduce((s, p) => s + p.views, 0),
      inquiries: pkgs.reduce((s, p) => s + p.inquiries, 0),
      avgConversion: avg(pkgs.map((p) => p.conversionRate)),
      avgEfficiency: avg(pkgs.map((p) => p.efficiencyScore)),
    };
  }, [performance.packages]);

  const summaryCards = [
    {
      title: "Total Package Views",
      value: fmt(totals.views),
      detail: "across all packages",
      icon: Eye,
      accent: true,
    },
    {
      title: "Total Inquiries",
      value: fmt(totals.inquiries),
      detail: "brand inquiries received",
      icon: MessageSquare,
    },
    {
      title: "Avg. Conversion Rate",
      value: fmtPct(totals.avgConversion),
      detail: "views to inquiries",
      icon: MousePointerClick,
    },
    {
      title: "Avg. Efficiency Score",
      value: `${totals.avgEfficiency.toFixed(0)}/100`,
      detail: "across your packages",
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-8 pt-2 text-[#1e3d2e] sm:px-6 lg:px-8 lg:pb-12">
      <div className="mx-auto max-w-[1320px] space-y-5">

        {/* ── Summary cards ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((c, i) => (
            <motion.div key={c.title} transition={{ delay: i * 0.06 }}>
              <SummaryCard {...c} loading={isLoading} />
            </motion.div>
          ))}
        </div>

        {/* ── Two-column: package cards + efficiency ranking ── */}
        <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">

          {/* Package breakdown */}
          <section className="space-y-4">
            <SectionHeading
              eyebrow="Per package"
              title="Performance breakdown"
              action="Manage packages"
              href="/creator/packages"
            />

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`${panelClass} overflow-hidden`}>
                    <div className="border-b border-[#e8eeeb] px-5 py-4">
                      <div className="h-5 w-48 animate-pulse rounded bg-[#e6eceb]" />
                    </div>
                    <div className="grid gap-px bg-[#e8eeeb] sm:grid-cols-3">
                      {[0, 1, 2].map((j) => (
                        <div key={j} className="space-y-2 bg-white p-5">
                          <div className="h-3 w-16 animate-pulse rounded bg-[#e6eceb]" />
                          <div className="h-9 w-full animate-pulse rounded-xl bg-[#e6eceb]" />
                          <div className="h-9 w-full animate-pulse rounded-xl bg-[#e6eceb]" />
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-4">
                      <div className="h-1.5 w-full animate-pulse rounded-full bg-[#e6eceb]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sorted.length > 0 ? (
              <div className="space-y-4">
                {sorted.map((pkg, i) => (
                  <PackageCard key={pkg.packageId} pkg={pkg} rank={i + 1} index={i} />
                ))}
              </div>
            ) : (
              <div className={`${panelClass} flex flex-col items-center gap-3 py-16`}>
                <Package className="size-10 text-[#c2d8cb]" />
                <p className="text-sm font-bold text-[#87938b]">No package data yet</p>
                <Link
                  href="/creator/packages/new"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2d6b4e] hover:underline"
                >
                  Create your first package <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </section>

          {/* Efficiency leaderboard */}
          <section className={`${panelClass} h-fit p-5 sm:p-6`}>
            <SectionHeading eyebrow="Ranked" title="Efficiency leaderboard" />

            <div className="mt-5 space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-4 w-4 animate-pulse rounded bg-[#e6eceb]" />
                      <div className="h-4 flex-1 animate-pulse rounded bg-[#e6eceb]" />
                      <div className="h-4 w-6 animate-pulse rounded bg-[#e6eceb]" />
                    </div>
                    <div className="ml-7 h-1.5 animate-pulse rounded-full bg-[#e6eceb]" />
                  </div>
                ))
              ) : sorted.length > 0 ? (
                sorted.map((pkg, i) => (
                  <EfficiencyRankRow
                    key={pkg.packageId}
                    pkg={pkg}
                    rank={i + 1}
                    maxScore={maxScore}
                    index={i}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[#d1ddd6] py-10">
                  <Trophy className="size-7 text-[#c2d8cb]" />
                  <p className="text-sm text-[#87938b]">Rankings appear once packages have data</p>
                </div>
              )}
            </div>

            {sorted.length > 0 && (
              <div className="mt-6 space-y-1.5 rounded-2xl bg-[#f4f7f5] p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#87938b]">
                  Score legend
                </p>
                <div className="space-y-1.5 pt-0.5">
                  {(Object.entries(TIER_CONFIG) as [EfficiencyTier, typeof TIER_CONFIG[EfficiencyTier]][]).map(
                    ([, cfg]) => (
                      <div key={cfg.label} className="flex items-center gap-2 text-[11px] font-semibold text-[#1e3d2e]">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span style={{ color: cfg.text }}>{cfg.label}</span>
                        <span className="text-[#87938b]">
                          {cfg.label === "Excellent"
                            ? "80–100"
                            : cfg.label === "Good"
                            ? "60–79"
                            : cfg.label === "Fair"
                            ? "40–59"
                            : "0–39"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
