"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, Link2, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { Creator } from "@/types";
import { formatFollowers } from "@/lib/utils";

// ── WhatsApp SVG icon ─────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Share card canvas renderer ────────────────────────────────────────────────
async function renderShareCard(
  canvas: HTMLCanvasElement,
  creator: Creator,
  profileUrl: string,
): Promise<void> {
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1e3d2e");
  bg.addColorStop(0.55, "#2d6b4e");
  bg.addColorStop(1, "#1a3326");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow
  const glow = ctx.createRadialGradient(W / 2, 420, 0, W / 2, 420, 600);
  glow.addColorStop(0, "rgba(255,255,255,0.06)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top brand bar
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, W, 100);
  ctx.fillStyle = "#e3a52f";
  ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ZingZing", W / 2, 64);

  // Avatar circle
  const avatarR = 160;
  const avatarX = W / 2;
  const avatarY = 340;

  // Avatar border ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 8, 0, Math.PI * 2);
  ctx.fillStyle = "#e3a52f";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#1e3d2e";
  ctx.fill();

  // Load and clip avatar image
  try {
    const img = await loadImage(creator.avatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  } catch {
    // Fallback: initials circle
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = "#244c39";
    ctx.fill();
    const initials = creator.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    ctx.fillStyle = "#e3a52f";
    ctx.font = `bold ${avatarR}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, avatarX, avatarY);
    ctx.textBaseline = "alphabetic";
  }

  // Name
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 72px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(truncate(creator.name, 22), W / 2, avatarY + avatarR + 80);

  // Username
  ctx.fillStyle = "#e3a52f";
  ctx.font = `500 46px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(`@${creator.username}`, W / 2, avatarY + avatarR + 140);

  // City
  if (creator.city) {
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.font = `400 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(`📍 ${creator.city}`, W / 2, avatarY + avatarR + 200);
  }

  // Categories pills
  const cats = creator.categories.slice(0, 4);
  const pillY = avatarY + avatarR + 280;
  const pillH = 64;
  const pillGap = 18;
  const pillPadX = 36;
  ctx.font = `600 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const pillWidths = cats.map((c) => ctx.measureText(c).width + pillPadX * 2);
  const totalPillW = pillWidths.reduce((a, b) => a + b, 0) + pillGap * (cats.length - 1);
  let pillX = (W - totalPillW) / 2;
  for (let i = 0; i < cats.length; i++) {
    const pw = pillWidths[i];
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    roundRect(ctx, pillX, pillY - pillH + 10, pw, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(cats[i], pillX + pw / 2, pillY + 2);
    pillX += pw + pillGap;
  }

  // Divider
  const divY = pillY + 90;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, divY);
  ctx.lineTo(W - 80, divY);
  ctx.stroke();

  // Stats row
  const statsY = divY + 120;
  const stats = [
    { label: "Followers", value: formatFollowers(creator.totalFollowers) },
    { label: "Engagement", value: `${creator.avgEngagementRate.toFixed(1)}%` },
    { label: "Rating", value: creator.rating > 0 ? `${creator.rating.toFixed(1)} ★` : "New" },
    { label: "Orders", value: String(creator.completedDeals) },
  ];
  const statColW = W / stats.length;
  for (let i = 0; i < stats.length; i++) {
    const cx = statColW * i + statColW / 2;
    ctx.fillStyle = "#e3a52f";
    ctx.font = `bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(stats[i].value, cx, statsY);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `400 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText(stats[i].label, cx, statsY + 52);
  }

  // Divider
  const div2Y = statsY + 110;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, div2Y);
  ctx.lineTo(W - 80, div2Y);
  ctx.stroke();

  // Rate card (if available)
  const rates = [
    creator.rateCardReel ? { label: "Reel", value: `PKR ${(creator.rateCardReel / 1000).toFixed(0)}K` } : null,
    creator.rateCardStory ? { label: "Story", value: `PKR ${(creator.rateCardStory / 1000).toFixed(0)}K` } : null,
    creator.rateCardPost ? { label: "Post", value: `PKR ${(creator.rateCardPost / 1000).toFixed(0)}K` } : null,
    creator.rateCardVideo ? { label: "Video", value: `PKR ${(creator.rateCardVideo / 1000).toFixed(0)}K` } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  let qrTopY = div2Y + 80;

  if (rates.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `700 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    ctx.fillText("STARTING RATES", W / 2, div2Y + 70);

    const rateColW = W / rates.length;
    const rateY = div2Y + 150;
    for (let i = 0; i < rates.length; i++) {
      const cx = rateColW * i + rateColW / 2;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(rates[i].value, cx, rateY);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `400 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      ctx.fillText(rates[i].label, cx, rateY + 46);
    }

    const div3Y = rateY + 110;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, div3Y);
    ctx.lineTo(W - 80, div3Y);
    ctx.stroke();
    qrTopY = div3Y + 80;
  }

  // QR code
  const qrSize = 380;
  const qrX = (W - qrSize) / 2;
  const qrDataUrl = await QRCode.toDataURL(profileUrl, {
    width: qrSize,
    margin: 2,
    color: { dark: "#1e3d2e", light: "#ffffff" },
  });
  const qrImg = await loadImage(qrDataUrl);

  // White rounded QR background
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX - 24, qrTopY - 24, qrSize + 48, qrSize + 48, 28);
  ctx.fill();
  ctx.drawImage(qrImg, qrX, qrTopY, qrSize, qrSize);

  // "Scan to collaborate" label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = `500 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText("Scan to collaborate", W / 2, qrTopY + qrSize + 72);

  // URL below QR
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `400 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText(profileUrl.replace("https://", ""), W / 2, qrTopY + qrSize + 118);

  // Bottom brand footer
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, H - 100, W, 100);
  ctx.fillStyle = "#e3a52f";
  ctx.font = `bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.fillText("ZingZing — Pakistan's Creator Marketplace", W / 2, H - 36);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ── Main modal component ──────────────────────────────────────────────────────

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: Creator;
}

export function ShareProfileModal({ isOpen, onClose, creator }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isRenderingCard, setIsRenderingCard] = useState(false);
  const [isQrReady, setIsQrReady] = useState(false);
  const hiddenCanvas = useRef<HTMLCanvasElement>(null);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${creator.username}`
      : `https://zingzing.pk/p/${creator.username}`;

  const shareText = `Check out ${creator.name} (@${creator.username}) on ZingZing — Pakistan's creator marketplace. ${profileUrl}`;

  // Generate QR code when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setIsQrReady(false);
    QRCode.toDataURL(profileUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#1e3d2e", light: "#ffffff" },
    })
      .then((url) => {
        setQrDataUrl(url);
        setIsQrReady(true);
      })
      .catch(() => setIsQrReady(false));
  }, [isOpen, profileUrl]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: `${creator.name} on ZingZing`, text: shareText, url: profileUrl });
    } catch {
      // user cancelled — no toast needed
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${creator.username}-qr.png`;
    a.click();
  };

  const handleDownloadCard = async () => {
    const canvas = hiddenCanvas.current;
    if (!canvas) return;
    setIsRenderingCard(true);
    try {
      await renderShareCard(canvas, creator, profileUrl);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${creator.username}-share-card.png`;
      a.click();
      toast.success("Share card downloaded");
    } catch {
      toast.error("Could not generate share card");
    } finally {
      setIsRenderingCard(false);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet — slides up on mobile, centered on desktop */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-3xl bg-white pb-10 shadow-2xl md:bottom-auto md:top-1/2 md:w-[480px] md:-translate-y-1/2 md:rounded-3xl"
          >
            {/* Handle (mobile) */}
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#d1ddd6] md:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Share</p>
                <h2 className="mt-0.5 text-xl font-extrabold tracking-tight text-[#1e3d2e]">
                  {creator.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f7f5] text-[#496159] transition-colors hover:bg-[#e6eceb]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 px-6">
              {/* URL copy row */}
              <div className="flex items-center gap-2 rounded-2xl border-2 border-[#dce6df] bg-[#f4f7f5] px-4 py-3">
                <Link2 className="size-4 shrink-0 text-[#496159]" />
                <span className="flex-1 truncate text-sm text-[#1e3d2e]">{profileUrl}</span>
                <button
                  onClick={handleCopy}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl bg-[#2d6b4e] px-3 text-xs font-bold text-white transition-colors hover:bg-[#1f5239]"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Action buttons row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* WhatsApp */}
                <ActionButton
                  label="WhatsApp"
                  color="bg-[#25d366]"
                  onClick={handleWhatsApp}
                  icon={<WhatsAppIcon className="size-6 text-white" />}
                />

                {/* Native share (mobile) or Twitter/X fallback */}
                {canNativeShare ? (
                  <ActionButton
                    label="More"
                    color="bg-[#1e3d2e]"
                    onClick={handleNativeShare}
                    icon={<Share2 className="size-6 text-white" />}
                  />
                ) : (
                  <ActionButton
                    label="X / Twitter"
                    color="bg-black"
                    onClick={() =>
                      window.open(
                        `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
                        "_blank",
                        "noopener",
                      )
                    }
                    icon={
                      <svg viewBox="0 0 24 24" fill="white" className="size-5">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    }
                  />
                )}

                {/* Download QR */}
                <ActionButton
                  label="QR Code"
                  color="bg-[#244c39]"
                  onClick={handleDownloadQr}
                  disabled={!isQrReady}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="size-6">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="3" height="3" rx="0.5" />
                      <rect x="19" y="14" width="2" height="2" rx="0.5" />
                      <rect x="14" y="19" width="2" height="2" rx="0.5" />
                      <rect x="18" y="19" width="3" height="2" rx="0.5" />
                    </svg>
                  }
                />

                {/* Download share card */}
                <ActionButton
                  label={isRenderingCard ? "Generating…" : "Share Card"}
                  color="bg-[#e3a52f]"
                  onClick={handleDownloadCard}
                  disabled={isRenderingCard}
                  icon={<Download className="size-6 text-white" />}
                />
              </div>

              {/* QR preview */}
              <AnimatePresence>
                {isQrReady && qrDataUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#d1ddd6] bg-[#f9faf9] py-5">
                      <img
                        src={qrDataUrl}
                        alt="QR code for profile"
                        className="size-44 rounded-xl"
                      />
                      <p className="text-xs font-semibold text-[#496159]">Scan to open profile</p>
                      <button
                        onClick={handleDownloadQr}
                        className="flex items-center gap-1.5 rounded-full border border-[#d1ddd6] bg-white px-4 py-1.5 text-xs font-bold text-[#2d6b4e] transition-colors hover:bg-[#f4f7f5]"
                      >
                        <Download className="size-3" /> Download QR
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="pb-1 text-center text-[11px] text-[#9aada5]">
                Share your profile to get discovered by brands
              </p>
            </div>

            {/* Hidden canvas for share card rendering */}
            <canvas ref={hiddenCanvas} className="hidden" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────

function ActionButton({
  label,
  color,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  color: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-2xl py-4 transition-opacity disabled:opacity-50 ${color}`}
    >
      {icon}
      <span className="text-[11px] font-bold text-white">{label}</span>
    </button>
  );
}
