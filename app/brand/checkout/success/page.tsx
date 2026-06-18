"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ArrowRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { paymentsService, type SafepaySessionStatus } from "@/services/payments.service";

type Phase = "polling" | "completed" | "failed" | "timeout";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 20; // 40 seconds before giving up

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const sessionId = searchParams.get("session");

  const [phase, setPhase] = useState<Phase>("polling");
  const [sessionStatus, setSessionStatus] = useState<SafepaySessionStatus | null>(null);
  const pollCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setPhase("failed");
      return;
    }

    const poll = async () => {
      try {
        const status = await paymentsService.getSafepaySessionStatus(sessionId);
        pollCount.current += 1;

        if (status.status === "completed") {
          setSessionStatus(status);
          setPhase("completed");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (status.status === "failed" || status.status === "cancelled" || status.status === "expired") {
          setSessionStatus(status);
          setPhase("failed");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        if (pollCount.current >= MAX_POLLS) {
          // Still "initiated" after timeout — payment may be processing
          setSessionStatus(status);
          setPhase("timeout");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        pollCount.current += 1;
        if (pollCount.current >= MAX_POLLS) {
          setPhase("timeout");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    };

    // Initial poll immediately, then on interval
    void poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-[2rem] border border-[#d9e0d8] bg-white p-8 shadow-[0_24px_80px_rgba(38,70,50,0.10)] text-center"
      >
        {phase === "polling" && <PollingState />}
        {phase === "completed" && <CompletedState status={sessionStatus} onDone={() => router.push("/brand/payments")} />}
        {phase === "failed" && <FailedState status={sessionStatus} onRetry={() => router.push("/brand/payments")} />}
        {phase === "timeout" && <TimeoutState onDone={() => router.push("/brand/payments")} />}
      </motion.div>
    </div>
  );
}

function PollingState() {
  return (
    <div className="space-y-5">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e7f0ea]">
        <Loader2 className="size-8 animate-spin text-[#185c39]" />
      </div>
      <div>
        <h1 className="text-xl font-black tracking-[-0.03em] text-[#173b2a]">Confirming payment…</h1>
        <p className="mt-2 text-sm text-[#647168]">
          We&apos;re waiting for confirmation from Safepay. This usually takes a few seconds.
        </p>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e7f0ea]">
        <motion.div
          className="h-full rounded-full bg-[#2d6b4e]"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "60%" }}
        />
      </div>
    </div>
  );
}

function CompletedState({
  status,
  onDone,
}: {
  status: SafepaySessionStatus | null;
  onDone: () => void;
}) {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e7f0ea]"
      >
        <CheckCircle className="size-8 text-[#185c39]" />
      </motion.div>

      <div>
        <h1 className="text-xl font-black tracking-[-0.03em] text-[#173b2a]">Payment confirmed!</h1>
        {status && (
          <p className="mt-1 text-2xl font-black text-[#185c39]">
            {formatPrice(status.amountPkr)}
          </p>
        )}
        <p className="mt-2 text-sm text-[#647168]">
          Your campaign wallet has been credited. You can now use these funds to place orders with creators.
        </p>
      </div>

      <div className="rounded-2xl bg-[#f4f2e9] p-4 text-left text-sm text-[#647168]">
        <div className="flex items-center gap-2 font-bold text-[#173b2a]">
          <Wallet className="size-4 text-[#185c39]" />
          Wallet updated
        </div>
        <p className="mt-1 text-xs">Funds are immediately available for new campaigns and orders.</p>
      </div>

      <Button
        onClick={onDone}
        className="w-full rounded-full bg-[#1e3d2e] font-black text-white hover:bg-[#2d6b4e]"
      >
        Go to Payments
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}

function FailedState({
  status,
  onRetry,
}: {
  status: SafepaySessionStatus | null;
  onRetry: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f9ebe8]">
        <XCircle className="size-8 text-[#9d3c36]" />
      </div>

      <div>
        <h1 className="text-xl font-black tracking-[-0.03em] text-[#173b2a]">Payment not completed</h1>
        <p className="mt-2 text-sm text-[#647168]">
          {status?.failureReason
            ? `Your payment was declined: ${status.failureReason}`
            : "The payment was not completed. No funds have been charged."}
        </p>
      </div>

      {status?.amountPkr && (
        <div className="rounded-2xl bg-[#f9ebe8] p-4 text-sm text-[#7a3030]">
          Attempted amount: <span className="font-black">{formatPrice(status.amountPkr)}</span>
        </div>
      )}

      <Button
        onClick={onRetry}
        className="w-full rounded-full bg-[#1e3d2e] font-black text-white hover:bg-[#2d6b4e]"
      >
        Try again
        <ArrowRight className="ml-2 size-4" />
      </Button>
    </div>
  );
}

function TimeoutState({ onDone }: { onDone: () => void }) {
  return (
    <div className="space-y-5">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#fff1cd]">
        <Loader2 className="size-8 text-[#b77a12]" />
      </div>

      <div>
        <h1 className="text-xl font-black tracking-[-0.03em] text-[#173b2a]">Still processing</h1>
        <p className="mt-2 text-sm text-[#647168]">
          Your payment is taking longer than expected to confirm. If the amount was deducted from your
          account, your wallet will be credited automatically once confirmed.
        </p>
      </div>

      <div className="rounded-2xl bg-[#fff8e6] p-4 text-left text-sm text-[#8b5e12]">
        You can safely close this page. Check your wallet balance in a few minutes.
      </div>

      <Button
        onClick={onDone}
        variant="outline"
        className="w-full rounded-full border-[#d9e0d8] font-black text-[#1e3d2e]"
      >
        Return to Payments
      </Button>
    </div>
  );
}
