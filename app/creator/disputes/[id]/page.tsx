"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { disputesService, type Dispute } from "@/services/disputes.service";
import { toast } from "sonner";

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const statusConfig: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  open: { label: "Open", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", Icon: AlertTriangle },
  under_review: { label: "Under Review", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", Icon: Clock },
  waiting_for_parties: { label: "Waiting for Parties", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", Icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-700 ring-1 ring-green-200", Icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600 ring-1 ring-gray-200", Icon: Shield },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#185c39]">
      {children}
    </p>
  );
}

export default function CreatorDisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    disputesService
      .getDispute(params.id)
      .then(setDispute)
      .catch(() => {
        setDispute(null);
        toast.error("Failed to load dispute");
      })
      .finally(() => setIsLoading(false));
  }, [params.id]);

  return (
    <div className="min-h-screen bg-[#fbfaf5] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/creator/disputes"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#496159] transition hover:text-[#185c39]"
        >
          <ArrowLeft className="size-4" /> Back to Disputes
        </Link>

        {isLoading ? (
          <div className="space-y-3">
            <div className={`${panelClass} h-28 animate-pulse bg-[#f4f7f5]`} />
            <div className={`${panelClass} h-40 animate-pulse bg-[#f4f7f5]`} />
            <div className={`${panelClass} h-32 animate-pulse bg-[#f4f7f5]`} />
          </div>
        ) : !dispute ? (
          <div className={`${panelClass} flex flex-col items-center gap-3 py-16 text-center`}>
            <Shield className="size-12 text-[#d1ddd6]" />
            <p className="text-sm font-semibold text-[#496159]">Dispute not found</p>
            <p className="max-w-xs text-xs text-[#8fa699]">
              This dispute may have been removed or you may not have access to it.
            </p>
            <Link href="/creator/disputes">
              <Button variant="outline" className="mt-2 rounded-xl border-[#d1ddd6] text-[#185c39]">
                Back to Disputes
              </Button>
            </Link>
          </div>
        ) : (
          <DisputeDetail dispute={dispute} />
        )}
      </div>
    </div>
  );
}

function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const cfg = statusConfig[dispute.status] ?? statusConfig.open;
  const { Icon } = cfg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className={`${panelClass} p-6`}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0eb]">
            <Icon className="size-5 text-[#185c39]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-[#173b2a]">{dispute.title}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8fa699]">
              Opened {formatRelativeTime(new Date(dispute.createdAt))}
            </p>
          </div>
        </div>
      </div>

      {/* Order */}
      <div className={`${panelClass} p-6`}>
        <SectionLabel>Order</SectionLabel>
        <div className="rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3.5">
          <Link
            href="/creator/orders"
            className="text-sm font-bold text-[#173b2a] transition hover:text-[#185c39]"
          >
            Order {dispute.orderNumber ?? dispute.orderId.slice(0, 8)}
          </Link>
          <p className="mt-0.5 text-xs text-[#647168]">{dispute.packageTitle}</p>
        </div>
      </div>

      {/* Parties */}
      <div className={`${panelClass} p-6`}>
        <SectionLabel>Parties</SectionLabel>
        <div className="space-y-1.5 rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3.5 text-sm text-[#3a5244]">
          <p><span className="font-semibold text-[#173b2a]">Brand:</span> {dispute.brandName}</p>
          <p><span className="font-semibold text-[#173b2a]">Creator:</span> {dispute.creatorName}</p>
        </div>
      </div>

      {/* Description */}
      <div className={`${panelClass} p-6`}>
        <SectionLabel>Description</SectionLabel>
        <p className="whitespace-pre-line leading-6 text-[#3a5244]">{dispute.description}</p>
      </div>

      {/* Resolution */}
      {dispute.resolution !== "none" && (
        <div className={`${panelClass} p-6`}>
          <SectionLabel>Resolution</SectionLabel>
          <div className="space-y-1.5 rounded-xl border border-[#e8f0ec] bg-[#f4f8f5] p-3.5">
            <p className="text-sm font-bold capitalize text-[#185c39]">
              {dispute.resolution.replace(/_/g, " ")}
            </p>
            {dispute.resolutionNotes ? (
              <p className="whitespace-pre-line text-sm leading-6 text-[#647168]">{dispute.resolutionNotes}</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={`${panelClass} p-6`}>
        <p className="mb-3 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#185c39]">
          <Clock className="size-3.5" /> Timeline
        </p>
        <ol className="space-y-3 border-l-2 border-[#d9e0d8] pl-4">
          {[
            { label: "Opened", ts: dispute.createdAt },
            { label: "Updated", ts: dispute.updatedAt },
            ...(dispute.resolvedAt ? [{ label: "Resolved", ts: dispute.resolvedAt }] : []),
          ].map((item) => (
            <li key={item.label} className="relative">
              <span className="absolute -left-[1.35rem] top-1 size-3 rounded-full border-2 border-[#185c39] bg-white" />
              <p className="text-sm font-semibold text-[#173b2a]">{item.label}</p>
              <p className="text-xs text-[#9ba8a1]">{formatDate(new Date(item.ts))}</p>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}
