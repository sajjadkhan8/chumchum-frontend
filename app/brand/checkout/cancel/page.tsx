"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paymentsService } from "@/services/payments.service";

const pendingPackageTopupKey = 'chumchum:pending-package-order-topup';

interface PendingPackageTopup {
  returnPath: string;
}

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");
  const [pendingPackageTopup, setPendingPackageTopup] = useState<PendingPackageTopup | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(pendingPackageTopupKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<PendingPackageTopup>;
      if (parsed.returnPath) {
        setPendingPackageTopup({ returnPath: parsed.returnPath });
      }
    } catch {
      window.sessionStorage.removeItem(pendingPackageTopupKey);
    }
  }, []);

  // Best-effort: record the cancellation so the backend can close the session
  useEffect(() => {
    if (sessionId) {
      void paymentsService.cancelSafepaySession(sessionId).catch(() => {
        // Non-fatal — session will expire automatically after 1 hour
      });
    }
  }, [sessionId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-[2rem] border border-[#d9e0d8] bg-white p-8 shadow-[0_24px_80px_rgba(38,70,50,0.10)] text-center space-y-5"
      >
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f9ebe8]">
          <XCircle className="size-8 text-[#9d3c36]" />
        </div>

        <div>
          <h1 className="text-xl font-black tracking-[-0.03em] text-[#173b2a]">Payment cancelled</h1>
          <p className="mt-2 text-sm text-[#647168]">
            You cancelled the payment. No funds have been charged and your wallet balance is unchanged.
          </p>
        </div>

        <div className="rounded-2xl bg-[#f4f2e9] p-4 text-sm text-[#647168]">
          {pendingPackageTopup
            ? "Return to the package page when you are ready to try the wallet top-up again."
            : "You can initiate a new top-up at any time from your Payments workspace."}
        </div>

        <Button
          onClick={() => {
            if (pendingPackageTopup) {
              window.sessionStorage.removeItem(pendingPackageTopupKey);
            }
            router.push(pendingPackageTopup?.returnPath || "/brand/payments");
          }}
          className="w-full rounded-full bg-[#1e3d2e] font-black text-white hover:bg-[#2d6b4e]"
        >
          <ArrowLeft className="mr-2 size-4" />
          {pendingPackageTopup ? "Back to Package" : "Back to Payments"}
        </Button>
      </motion.div>
    </div>
  );
}
