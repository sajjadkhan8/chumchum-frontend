"use client";

import { useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";

type CreatorMetricCardProps = {
  title: string;
  value?: React.ReactNode;
  sub?: React.ReactNode;
  Icon: React.ElementType;
  spark?: number[];
  animatedValue?: number;
  fmt?: (n: number) => string;
  trend?: number;
  dark?: boolean;
  gold?: boolean;
};

function Sparkline({ data, color = "#e6aa38" }: { data: number[]; color?: string }) {
  const W = 64, H = 24;
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map((v) => H - ((v - min) / rng) * (H - 2) - 1);
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const area = `M${xs[0]},${H} ` + xs.map((x, i) => `L${x},${ys[i]}`).join(" ") + ` L${xs[xs.length - 1]},${H} Z`;
  const id = `sg-${color.replace("#", "")}-${data.join("-")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-16 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function useCounter(target?: number, fmt?: (n: number) => string) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!el.current || target === undefined) return;
    if (target === 0) {
      el.current.textContent = fmt ? fmt(0) : "0";
      return;
    }
    const duration = 1300;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = eased * target;
      if (el.current) el.current.textContent = fmt ? fmt(v) : Math.round(v).toLocaleString();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, fmt]);
  return el;
}

export function CreatorMetricCard({
  title,
  value,
  sub,
  Icon,
  spark,
  animatedValue,
  fmt,
  trend,
  dark = false,
  gold = false,
}: CreatorMetricCardProps) {
  const ref = useCounter(animatedValue, fmt);
  const resolvedValue = animatedValue !== undefined
    ? <span ref={ref} className="block truncate">{fmt ? fmt(0) : "0"}</span>
    : value;
  const renderSub = (className: string) => {
    if (!sub) return null;
    if (typeof sub === "string") {
      return <p className={className}>{sub}</p>;
    }
    return <div className={className.replace("truncate ", "")}>{sub}</div>;
  };

  if (dark) {
    return (
      <article className="metric-card group relative overflow-hidden rounded-2xl border border-[#3e6a50] bg-[#3e6a50] p-4 text-white transition-all duration-300 hover:scale-[1.015] hover:shadow-xl sm:p-5">
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25"
          style={{ background: "radial-gradient(ellipse at 100% 0%, #5a8265, transparent 70%)" }}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4e4da]">{title}</p>
            <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight text-[#f0c56e]">{resolvedValue}</p>
            {renderSub("mt-1.5 truncate text-[10px] font-medium text-[#d4e4da]/80 sm:text-[11px]")}
            {trend !== undefined && (
              <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#c8f0d4]">
                <TrendingUp className="size-3" />
                {Math.abs(trend)}% this month
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-white/10 text-[#f0c56e] sm:size-9">
              <Icon className="size-3.5 sm:size-4" />
            </span>
            {spark && <div className="hidden opacity-80 sm:block"><Sparkline data={spark} color="#f0c56e" /></div>}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="metric-card group relative overflow-hidden rounded-2xl border-2 border-[#dce8e2] bg-white p-4 transition-all duration-300 hover:scale-[1.015] hover:border-[#2d6b4e]/50 hover:shadow-lg sm:p-5"
      style={{ boxShadow: "0 2px 8px rgba(30,61,46,0.07), 0 1px 2px rgba(30,61,46,0.04)" }}
    >
      <div className={`absolute left-0 top-0 h-[3px] w-full rounded-t-2xl bg-gradient-to-r ${gold ? "from-[#e6aa38]/60" : "from-[#2d6b4e]/40"} to-transparent`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${gold ? "text-[#b77a12]" : "text-[#7a9a87]"}`}>{title}</p>
          <p className="mt-2 text-2xl font-extrabold leading-none tracking-tight text-[#1e3d2e]">{resolvedValue}</p>
          {renderSub("mt-1.5 truncate text-[10px] font-medium text-[#7a9a87] sm:text-[11px]")}
          {trend !== undefined && (
            <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <TrendingUp className="size-3" />
              {Math.abs(trend)}% this month
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className={`grid size-8 place-items-center rounded-xl sm:size-9 ${gold ? "bg-[#fdf8ec] text-[#e6aa38]" : "bg-[#e8f0ec] text-[#2d6b4e]"}`}>
            <Icon className="size-3.5 sm:size-4" />
          </span>
          {spark && <div className="hidden opacity-80 sm:block"><Sparkline data={spark} color="#2d6b4e" /></div>}
        </div>
      </div>
    </article>
  );
}
