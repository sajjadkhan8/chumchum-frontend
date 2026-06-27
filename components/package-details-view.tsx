"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  AlertCircle,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  MessageCircle,
  MousePointerClick,
  Package,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/categories";
import { getPlatformMeta } from "@/components/platform-icons";
import type { Creator, CreatorPackage, Order } from "@/types";

export type PackageDetailBadge = {
  label: string;
  className: string;
  Icon: React.ElementType;
};

type PackageDetailsViewProps = {
  pkg: CreatorPackage;
  badges?: PackageDetailBadge[];
  creator?: Creator | null;
  activeOrder?: Order | null;
  canOrder?: boolean;
  shareUrl?: string;
  creatorProfileHref?: string;
  onOrder?: (pkg: CreatorPackage) => void;
  onViewActiveOrder?: (order: Order) => void;
  onClose?: () => void;
  compact?: boolean;
  className?: string;
};

type PackageDetailsModalProps = Omit<PackageDetailsViewProps, "pkg" | "compact" | "className"> & {
  pkg: CreatorPackage | null;
  isOpen: boolean;
  onClose: () => void;
};

const formatOrderStatusLabel = (status: Order["status"]) => status.replace(/_/g, " ");

function getPackageShareUrl(pkg: CreatorPackage, shareUrl?: string) {
  if (shareUrl) return shareUrl;
  if (typeof window === "undefined") return `/packages/${pkg.id}`;
  return `${window.location.origin}/packages/${pkg.id}`;
}

function getPriceDisplay(pkg: CreatorPackage) {
  const showCashAmount = pkg.dealType === "paid" ? pkg.price : pkg.hybridCashAmount || pkg.price;
  if (pkg.dealType === "barter") return pkg.barterValue || "Barter deal";
  if (pkg.dealType === "hybrid") return `${formatPrice(showCashAmount)} + barter`;
  return formatPrice(pkg.price);
}

function getMedia(pkg: CreatorPackage) {
  return [pkg.thumbnail, ...(pkg.mediaUrls ?? [])].filter(Boolean);
}

async function sharePackage(title: string, url: string) {
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Package link copied");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Could not share package link");
  }
}

export function PackageDetailsView({
  pkg,
  badges = [],
  creator,
  activeOrder,
  canOrder = true,
  shareUrl,
  creatorProfileHref,
  onOrder,
  onViewActiveOrder,
  onClose,
  compact = false,
  className,
}: PackageDetailsViewProps) {
  const priceDisplay = getPriceDisplay(pkg);
  const media = getMedia(pkg);
  const resolvedShareUrl = useMemo(() => getPackageShareUrl(pkg, shareUrl), [pkg, shareUrl]);
  const detailStats = [
    { label: "Orders", value: pkg.ordersCompleted.toLocaleString(), Icon: Package },
    { label: "Views", value: pkg.analytics.views.toLocaleString(), Icon: Eye },
    { label: "Clicks", value: pkg.analytics.clicks.toLocaleString(), Icon: MousePointerClick },
    { label: "Inquiries", value: pkg.analytics.inquiries.toLocaleString(), Icon: MessageCircle },
    { label: "Conversion", value: `${pkg.analytics.conversionRate}%`, Icon: BarChart3 },
    { label: "Completion", value: `${pkg.analytics.completionRate || 0}%`, Icon: BadgeCheck },
  ];

  return (
    <div className={cn("overflow-hidden bg-white", className)}>
      <div className="relative overflow-hidden bg-[#1e3d2e] px-5 py-5 text-white sm:px-6">
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-2/3 opacity-25"
          style={{ background: "radial-gradient(ellipse at 100% 0%, #e6aa38, transparent 65%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-1.5">
              {badges.length > 0 ? badges.map(({ label, className: badgeClassName, Icon }) => (
                <span key={label} className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold", badgeClassName)}>
                  <Icon className="size-3" />
                  {label}
                </span>
              )) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white/75">
                  Package
                </span>
              )}
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-white sm:text-3xl">{pkg.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/62">
              {pkg.shortDescription || pkg.description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0c56e]">Package Price</p>
              <p className="mt-1 text-lg font-black text-white">{priceDisplay}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/45">{pkg.deliveryDays} days delivery</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void sharePackage(pkg.title, resolvedShareUrl)}
              className="rounded-xl border-white/15 bg-white/10 text-[12px] font-extrabold text-white hover:bg-white/15 hover:text-white"
            >
              <Share2 className="mr-2 size-3.5" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("overflow-y-auto px-5 py-5 sm:px-6", compact && "max-h-[calc(100dvh-15rem)] sm:max-h-[calc(90dvh-14rem)]")}>
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {media.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5]">
                <div className="relative aspect-[16/9] bg-[#e8f0ec]">
                  <Image src={media[0]} alt={pkg.title} fill className="object-cover" />
                </div>
                {media.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-3">
                    {media.slice(1, 5).map((url, index) => (
                      <div key={`${url}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-[#e8f0ec]">
                        <Image src={url} alt={`${pkg.title} media ${index + 2}`} fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Scope</p>
              <h3 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Package Details</h3>
              <p className="mt-3 text-[13px] leading-6 text-[#496159]">
                {pkg.fullDescription || pkg.description}
              </p>
              {pkg.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pkg.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#e8f0ec] px-2.5 py-1 text-[10px] font-bold text-[#2d6b4e]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Deliverables</p>
              <div className="mt-3 grid gap-2">
                {pkg.deliverables.length > 0 ? pkg.deliverables.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2 text-[12px]">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#2d6b4e]" />
                    <span className="leading-5 text-[#496159]">{item}</span>
                  </div>
                )) : (
                  <p className="text-sm text-[#647168]">No deliverables listed.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            {creator && (
              <section className="rounded-2xl border border-[#e2e7e1] bg-white p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Creator</p>
                <h3 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{creator.name}</h3>
                <p className="mt-2 text-[12px] leading-5 text-[#647168]">
                  {getCategoryLabel(creator.categories[0] || "GENERAL")} creator in {creator.city || "Pakistan"}
                </p>
                {creatorProfileHref && (
                  <Button asChild variant="outline" className="mt-3 rounded-xl border-[#d1ddd6] bg-white text-[12px] font-extrabold text-[#2d6b4e] hover:bg-[#e8f0ec]">
                    <Link href={creatorProfileHref}>
                      View Creator
                      <ExternalLink className="ml-2 size-3.5" />
                    </Link>
                  </Button>
                )}
              </section>
            )}

            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Performance</p>
              <h3 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Package Signals</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {detailStats.map(({ label, value, Icon }) => (
                  <div key={label} className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a9a87]">{label}</p>
                      <Icon className="size-3.5 text-[#2d6b4e]" />
                    </div>
                    <p className="mt-1 text-lg font-black text-[#1e3d2e]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e2e7e1] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Format</p>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Platform", value: getPlatformMeta(pkg.platform)?.label ?? pkg.platform },
                  { label: "Category", value: getCategoryLabel(pkg.category) },
                  { label: "Deal type", value: pkg.dealType.replace("_", " ") },
                  { label: "Revisions", value: `${pkg.revisions ?? 0} rounds` },
                  { label: "Repeat brands", value: `${pkg.analytics.repeatBrands || 0}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ed] bg-[#fbfaf5] px-3 py-2">
                    <span className="text-[12px] font-semibold text-[#647168]">{label}</span>
                    <span className="text-right text-[12px] font-extrabold capitalize text-[#1e3d2e]">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {(pkg.barterDescription || pkg.creatorExpectations || pkg.barterValue) && (
              <section className="rounded-2xl border border-[#efcf83] bg-[#fff9e8] p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9a6b00]">Barter terms</p>
                {pkg.barterValue && <p className="mt-2 text-sm font-extrabold text-[#1e3d2e]">{pkg.barterValue}</p>}
                {pkg.barterDescription && <p className="mt-2 text-[12px] leading-5 text-[#8b5e12]">{pkg.barterDescription}</p>}
                {pkg.creatorExpectations && (
                  <p className="mt-2 text-[12px] leading-5 text-[#8b5e12]">
                    <span className="font-extrabold">Creator expects:</span> {pkg.creatorExpectations}
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#edf1ed] bg-[#fbfaf5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-[#647168]">
            {pkg.ordersCompleted} completed order{pkg.ordersCompleted === 1 ? "" : "s"} on this package
          </p>
          {activeOrder && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#efcf83] bg-[#fff9e8] px-2.5 py-1 text-[11px] font-extrabold text-[#8b5e12]">
              <AlertCircle className="size-3.5" />
              Active {formatOrderStatusLabel(activeOrder.status)} order already exists
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void sharePackage(pkg.title, resolvedShareUrl)}
            className="rounded-xl border-[#d1ddd6] bg-white font-extrabold text-[#496159] hover:bg-[#e8f0ec]"
          >
            <Copy className="mr-2 size-3.5" />
            Copy Link
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="rounded-xl border-[#d1ddd6] bg-white font-extrabold text-[#496159] hover:bg-[#e8f0ec]">
              Close
            </Button>
          )}
          <Button
            disabled={activeOrder ? false : !canOrder || !onOrder}
            onClick={() => activeOrder ? onViewActiveOrder?.(activeOrder) : onOrder?.(pkg)}
            className={cn(
              "rounded-xl font-extrabold text-white",
              activeOrder ? "bg-[#8b5e12] hover:bg-[#70490d]" : "bg-[#2d6b4e] hover:bg-[#1f5239]"
            )}
          >
            {activeOrder ? "View Active Order" : "Order Package"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PackageDetailsModal({
  pkg,
  isOpen,
  onClose,
  ...props
}: PackageDetailsModalProps) {
  if (!pkg) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] max-w-[calc(100%-1rem)] overflow-hidden rounded-[1.75rem] border border-[#d1ddd6] bg-white p-0 shadow-[0_24px_64px_rgba(38,70,50,0.18)] sm:max-h-[90dvh] sm:max-w-3xl">
        <DialogTitle className="sr-only">{pkg.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Package details, performance signals, deliverables, sharing, and order actions.
        </DialogDescription>
        <PackageDetailsView pkg={pkg} compact onClose={onClose} {...props} />
      </DialogContent>
    </Dialog>
  );
}
