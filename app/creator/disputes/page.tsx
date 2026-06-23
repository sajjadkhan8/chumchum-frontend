"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { disputesService, type Dispute } from "@/services/disputes.service";
import { toast } from "sonner";
import Link from "next/link";

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

const statusConfig: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  open: { label: "Open", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", Icon: AlertTriangle },
  under_review: { label: "Under Review", color: "bg-blue-50 text-blue-700 ring-1 ring-blue-200", Icon: Clock },
  waiting_for_parties: { label: "Waiting for Parties", color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", Icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-50 text-green-700 ring-1 ring-green-200", Icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-600 ring-1 ring-gray-200", Icon: Shield },
};

function DisputeCard({ dispute }: { dispute: Dispute }) {
  const cfg = statusConfig[dispute.status] ?? statusConfig.open;
  const { Icon } = cfg;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
    <Link
      href={`/creator/disputes/${dispute.id}`}
      className={`${panelClass} flex flex-col gap-3 p-5 transition hover:border-[#b9cdc1] hover:shadow-[0_22px_60px_rgba(38,70,50,0.12)] sm:flex-row sm:items-start sm:justify-between`}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0eb]">
          <Icon className="size-5 text-[#185c39]" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#173b2a]">{dispute.title}</span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#496159]">
            Order {dispute.orderNumber ?? dispute.orderId.slice(0, 8)} — {dispute.packageTitle}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-[#6b8070]">{dispute.description}</p>
          <p className="mt-2 text-[10px] text-[#8fa699]">
            Opened {formatDate(new Date(dispute.createdAt))}
          </p>
        </div>
      </div>
      {dispute.resolution !== 'none' && (
        <div className="shrink-0 pl-14 text-left sm:pl-0 sm:text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8fa699]">Resolution</p>
          <p className="mt-0.5 text-xs font-bold text-[#185c39] capitalize">
            {dispute.resolution.replace(/_/g, ' ')}
          </p>
        </div>
      )}
    </Link>
    </motion.div>
  );
}

function DisputesContent() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    disputesService
      .getMyDisputes()
      .then((r) => setDisputes(r.disputes))
      .catch(() => toast.error('Failed to load disputes'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${panelClass} h-24 animate-pulse bg-[#f4f7f5]`} />
        ))}
      </div>
    );
  }

  if (!disputes.length) {
    return (
      <div className={`${panelClass} flex flex-col items-center gap-3 py-16 text-center`}>
        <Shield className="size-12 text-[#d1ddd6]" />
        <p className="text-sm font-semibold text-[#496159]">No disputes yet</p>
        <p className="max-w-xs text-xs text-[#8fa699]">
          If you have an issue with an order, use the Dispute button on the orders page.
        </p>
        <Link href="/creator/orders">
          <Button variant="outline" className="mt-2 rounded-xl border-[#d1ddd6] text-[#185c39]">
            View Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {disputes.map((d) => (
        <DisputeCard key={d.id} dispute={d} />
      ))}
    </div>
  );
}

export default function CreatorDisputesPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf5] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#173b2a]">
            <AlertTriangle className="size-5 text-[#e6aa38]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#173b2a]">Disputes</h1>
            <p className="text-sm text-[#496159]">Track the status of your open disputes</p>
          </div>
        </div>
        <Suspense>
          <DisputesContent />
        </Suspense>
      </div>
    </div>
  );
}
