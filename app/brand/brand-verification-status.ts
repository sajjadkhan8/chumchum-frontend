import type { BrandVerificationStatus } from "@/types";

export const brandVerificationStatusMeta: Record<BrandVerificationStatus, { label: string; className: string }> = {
  verified: { label: "✓ Verified", className: "border-[#bcd3c5] bg-[#eef6f1] text-[#185c39]" },
  pending: { label: "⏳ Pending review", className: "border-[#efcf83] bg-[#fffbf0] text-[#8b5e12]" },
  under_review: { label: "⏳ Under review", className: "border-[#efcf83] bg-[#fffbf0] text-[#8b5e12]" },
  rejected: { label: "✗ Verification rejected", className: "border-[#f5c2c2] bg-[#fff5f5] text-[#c13a3a]" },
  unverified: { label: "Unverified", className: "border-[#d9e0d8] bg-[#f4f2e9] text-[#8fa098]" },
};
