"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePercent, Check, Clipboard, Copy, Link2, Loader2, Share2, Sparkles, Users, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { affiliateService, type AffiliateCommission, type AffiliateOverview } from "@/services/affiliate.service";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

const emptyOverview: AffiliateOverview = {
  code: "",
  shareUrl: "",
  rateBasisPoints: 100,
  totalCommission: 0,
  referredCreators: 0,
  commissionCount: 0,
};

function rateLabel(rateBasisPoints: number) {
  return `${(rateBasisPoints / 100).toFixed(rateBasisPoints % 100 === 0 ? 0 : 2)}%`;
}

export function AffiliatePageContent({ role }: { role: "creator" | "brand" }) {
  const [overview, setOverview] = useState<AffiliateOverview>(emptyOverview);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const dashboardHref = role === "creator" ? "/creator/dashboard" : "/brand/dashboard";
  const roleCopy = role === "creator"
    ? "Share your affiliate link with creators you know. When they complete paid work, your commission appears in earnings."
    : "Invite creators from your network. Brand-owned commission is tracked here until brand payout support is enabled.";

  const load = async () => {
    setLoading(true);
    try {
      const [overviewResponse, commissionResponse] = await Promise.all([
        affiliateService.getOverview(),
        affiliateService.getCommissions(0, 50),
      ]);
      setOverview(overviewResponse);
      setCommissions(commissionResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load affiliate details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const shareUrl = useMemo(() => overview.shareUrl || (overview.code ? `${window.location.origin}/signup?affiliate=${overview.code}` : ""), [overview]);

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const next = await affiliateService.createOrGetLink();
      setOverview(next);
      toast.success("Affiliate link ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create affiliate link");
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Affiliate link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copy failed");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center bg-[#fbfaf5]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#d9e0d8] bg-white px-5 py-4 text-sm font-bold text-[#526259] shadow-sm">
          <Loader2 className="size-4 animate-spin text-[#2d6b4e]" />
          Loading affiliate program
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#fbfaf5] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="grid gap-0 lg:grid-cols-[1fr_22rem]">
            <div className="p-5 sm:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                <BadgePercent className="size-3.5" />
                Affiliate Program
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                Earn {rateLabel(overview.rateBasisPoints)} from referred creator earnings.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{roleCopy}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {overview.code ? (
                  <Button onClick={handleCopy} className="h-11 rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bd58]">
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                ) : (
                  <Button onClick={handleCreateLink} disabled={creating} className="h-11 rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bd58]">
                    {creating ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                    Create link
                  </Button>
                )}
                <Button asChild variant="outline" className="h-11 rounded-full border-white/15 bg-white/8 px-5 font-black text-white hover:bg-white/12 hover:text-white">
                  <Link href={dashboardHref}>Back to dashboard <ArrowRight className="size-4" /></Link>
                </Button>
              </div>
            </div>
            <aside className="border-t border-white/10 bg-white/[0.06] p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f0c56e]">Your share link</p>
              <div className="mt-3 rounded-[1.25rem] border border-white/12 bg-[#102d20]/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-[#f0c56e]">
                    <Link2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{overview.code || "No code yet"}</p>
                    <p className="truncate text-xs text-white/45">{shareUrl || "Create your link to start sharing"}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total commission", value: formatPrice(overview.totalCommission), Icon: WalletCards },
            { label: "Referred creators", value: overview.referredCreators.toLocaleString(), Icon: Users },
            { label: "Commission rate", value: rateLabel(overview.rateBasisPoints), Icon: Sparkles },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="rounded-[1.5rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
              <span className="grid size-9 place-items-center rounded-xl bg-[#e7f0ea] text-[#185c39]">
                <Icon className="size-4" />
              </span>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">{label}</p>
              <p className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#173b2a]">{value}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-[1.6rem] border border-[#d9e0d8] bg-white shadow-[0_14px_45px_rgba(38,70,50,0.055)]">
          <div className="flex items-center justify-between border-b border-[#edf0eb] bg-[#fbfaf5] px-5 py-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">Commission history</p>
              <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-[#173b2a]">Completed referrals</h2>
            </div>
            <Clipboard className="size-5 text-[#b77a12]" />
          </div>
          {commissions.length > 0 ? (
            <div className="divide-y divide-[#edf0eb]">
              {commissions.map((commission) => (
                <div key={commission.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#173b2a]">{commission.earningCreatorName}</p>
                    <p className="mt-1 text-xs font-semibold text-[#647168]">
                      {commission.orderNumber || commission.orderId} · {formatRelativeTime(new Date(commission.createdAt))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="rounded-full border border-[#d9e0d8] bg-[#fbfaf5] px-3 py-1 text-[11px] font-black capitalize text-[#647168]">
                      {commission.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-sm font-black text-[#185c39]">{formatPrice(commission.commissionAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e7f0ea] text-[#185c39]">
                <Users className="size-5" />
              </div>
              <p className="mt-3 text-sm font-black text-[#173b2a]">No commission yet</p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#647168]">
                Share your link with creators. Their completed paid orders will appear here once they start earning.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
