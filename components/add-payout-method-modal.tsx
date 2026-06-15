"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { type PayoutMethodType } from "@/services/earnings.service";

// ─── shared constants ──────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors focus:border-[#2d6b4e] focus:ring-4 focus:ring-[#2d6b4e]/8";

const triggerClass =
  "flex h-10 w-full items-center justify-between gap-2 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] outline-none transition-colors focus:border-[#2d6b4e]";

const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]";

// ─── logo helpers ──────────────────────────────────────────────────────────────

const logoUrlForDomain = (domain: string) =>
  `https://logo.clearbit.com/${domain}`;

const faviconUrlForDomain = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

export const PAYOUT_METHOD_LOGOS: Record<
  string,
  { label: string; domain?: string; fallback: string }
> = {
  JAZZCASH: { label: "JazzCash", domain: "jazzcash.com.pk", fallback: "JC" },
  EASYPAISA: { label: "Easypaisa", domain: "easypaisa.com.pk", fallback: "EP" },
  BANK_TRANSFER: { label: "Bank Transfer", fallback: "PK" },
};

export const PAKISTANI_BANKS = [
  { value: "meezan", label: "Meezan Bank", domain: "meezanbank.com", fallback: "MB" },
  { value: "hbl", label: "HBL (Habib Bank Limited)", domain: "hbl.com", fallback: "HBL" },
  { value: "ubl", label: "UBL (United Bank Limited)", domain: "ubl.com.pk", fallback: "UBL" },
  { value: "mcb", label: "MCB Bank", domain: "mcb.com.pk", fallback: "MCB" },
  { value: "alfalah", label: "Bank Alfalah", domain: "bankalfalah.com", fallback: "BA" },
  { value: "nbp", label: "NBP (National Bank of Pakistan)", domain: "nbp.com.pk", fallback: "NBP" },
  { value: "abl", label: "ABL (Allied Bank Limited)", domain: "abl.com", fallback: "ABL" },
  { value: "faysal", label: "Faysal Bank", domain: "faysalbank.com", fallback: "FBL" },
  { value: "standard_chartered", label: "Standard Chartered Pakistan", domain: "sc.com", fallback: "SC" },
  { value: "habib_metro", label: "HabibMetro Bank", domain: "habibmetro.com", fallback: "HM" },
  { value: "bank_al_habib", label: "Bank AL Habib", domain: "bankalhabib.com", fallback: "BAH" },
  { value: "askari", label: "Askari Bank", domain: "askaribank.com", fallback: "AKBL" },
  { value: "js", label: "JS Bank", domain: "jsbl.com", fallback: "JS" },
  { value: "soneri", label: "Soneri Bank", domain: "soneribank.com", fallback: "SB" },
  { value: "silk", label: "Silkbank", domain: "silkbank.com.pk", fallback: "SK" },
  { value: "summit", label: "Summit Bank", domain: "summitbank.com.pk", fallback: "SMB" },
  { value: "samba", label: "Samba Bank", domain: "samba.com.pk", fallback: "SAM" },
  { value: "albaraka", label: "Al Baraka Bank Pakistan", domain: "albaraka.com.pk", fallback: "AB" },
  { value: "dubai_islamic", label: "Dubai Islamic Bank Pakistan", domain: "dibpak.com", fallback: "DIB" },
  { value: "bankislami", label: "BankIslami", domain: "bankislami.com.pk", fallback: "BI" },
  { value: "ztbl", label: "ZTBL (Zarai Taraqiati Bank Limited)", domain: "ztbl.com.pk", fallback: "ZTBL" },
  { value: "khushhali", label: "Khushhali Microfinance Bank", domain: "khushhalibank.com.pk", fallback: "KMBL" },
  { value: "mobilink_microfinance", label: "Mobilink Microfinance Bank", domain: "mobilinkbank.com", fallback: "MMBL" },
  { value: "telenor_microfinance", label: "Telenor Microfinance Bank", domain: "telenorbank.pk", fallback: "TMB" },
];

export function BrandLogo({
  alt,
  domain,
  fallback,
}: {
  alt: string;
  domain?: string;
  fallback: string;
}) {
  const [source, setSource] = useState<"logo" | "favicon" | "initials">(
    domain ? "logo" : "initials"
  );

  if (!domain || source === "initials") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[#e6eceb] text-[10px] font-bold text-[#2d6b4e]">
        {fallback}
      </span>
    );
  }

  return (
    <img
      src={source === "logo" ? logoUrlForDomain(domain) : faviconUrlForDomain(domain)}
      alt={alt}
      className="size-6 shrink-0 rounded bg-white object-contain p-0.5"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSource(source === "logo" ? "favicon" : "initials")}
    />
  );
}

// ─── modal ─────────────────────────────────────────────────────────────────────

interface AddPayoutMethodModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMethod: (method: {
    type: PayoutMethodType;
    name: string;
    accountDetails: string;
    bankName?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  triggerButtonVariant?: string;
  showTriggerButton?: boolean;
}

export function AddPayoutMethodModal({
  isOpen,
  onOpenChange,
  onAddMethod,
  isLoading = false,
  showTriggerButton = true,
}: AddPayoutMethodModalProps) {
  const [methodType, setMethodType] = useState<PayoutMethodType>("BANK_TRANSFER");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountDetails, setAccountDetails] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<"iban" | "number">("iban");

  const resetForm = () => {
    setMethodType("BANK_TRANSFER");
    setAccountHolderName("");
    setAccountDetails("");
    setBankName("");
    setAccountType("iban");
  };

  const handleClose = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const validateForm = (): string | null => {
    if (!accountHolderName.trim()) return "Account holder name is required";
    if (!accountDetails.trim()) return "Account details are required";
    if (methodType === "BANK_TRANSFER" && !bankName) return "Please select a bank";
    const normalizedType = String(methodType).toUpperCase();
    if (normalizedType === "BANK_TRANSFER") {
      if (accountType === "iban") {
        if (!/^PK\d{2}[A-Z0-9]{20,30}$/i.test(accountDetails.trim()))
          return "Use a valid Pakistani IBAN (example: PK36ABCD0123456789012345)";
      } else {
        if (!/^\d{16,18}$/.test(accountDetails.trim()))
          return "Bank account number should be 16-18 digits";
      }
    } else {
      if (!/^\+?\d{10,15}$/.test(accountDetails.replaceAll("-", "")))
        return "Use a valid wallet number (10 to 15 digits)";
    }
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) { toast.error(error); return; }
    try {
      await onAddMethod({
        type: methodType,
        name: accountHolderName,
        accountDetails,
        bankName: methodType === "BANK_TRANSFER" ? bankName : undefined,
      });
      handleClose(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add payout method");
    }
  };

  const isBankTransfer = methodType === "BANK_TRANSFER";
  const selectedMethod = PAYOUT_METHOD_LOGOS[methodType];
  const selectedBank = PAKISTANI_BANKS.find((b) => b.value === bankName);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full bg-[#2d6b4e] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1f5239]"
          >
            <Plus className="size-3.5" />
            Add Method
          </button>
        </DialogTrigger>
      )}

      <DialogContent className="gap-0 overflow-hidden rounded-[1.6rem] border border-[#d1ddd6] bg-white p-0 shadow-[0_24px_64px_rgba(38,70,50,0.14)] sm:max-w-md [&>button]:hidden">
        {/* Header */}
        <div className="relative bg-[#2d6b4e] px-6 py-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/60">
            Earnings
          </p>
          <h2 className="mt-0.5 text-lg font-extrabold tracking-[-0.03em] text-white">
            Add Payout Method
          </h2>
          <p className="mt-0.5 text-xs text-white/60">
            Add a bank account or wallet to receive your earnings
          </p>
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5 sm:p-6">
          {/* Method type */}
          <div className="space-y-1.5">
            <p className={labelClass}>Payment Method Type</p>
            <SelectPrimitive.Root
              value={methodType}
              onValueChange={(v) => {
                setMethodType(v as PayoutMethodType);
                setAccountDetails("");
                setBankName("");
              }}
            >
              <SelectPrimitive.Trigger className={triggerClass}>
                <div className="flex items-center gap-2">
                  {selectedMethod && (
                    <BrandLogo alt={`${selectedMethod.label} logo`} domain={selectedMethod.domain} fallback={selectedMethod.fallback} />
                  )}
                  <SelectPrimitive.Value />
                </div>
                <SelectPrimitive.Icon asChild>
                  <ChevronDownIcon className="size-4 text-[#87938b]" />
                </SelectPrimitive.Icon>
              </SelectPrimitive.Trigger>
              <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                  position="popper"
                  className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#d1ddd6] bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                  <SelectPrimitive.Viewport className="p-1">
                    {[
                      { value: "JAZZCASH", label: "JazzCash", logo: PAYOUT_METHOD_LOGOS.JAZZCASH },
                      { value: "EASYPAISA", label: "Easypaisa", logo: PAYOUT_METHOD_LOGOS.EASYPAISA },
                      { value: "BANK_TRANSFER", label: "Bank Transfer", logo: PAYOUT_METHOD_LOGOS.BANK_TRANSFER },
                    ].map((opt) => (
                      <SelectPrimitive.Item
                        key={opt.value}
                        value={opt.value}
                        className="relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1e3d2e] outline-none data-[highlighted]:bg-[#f4f7f5]"
                      >
                        <BrandLogo alt={`${opt.label} logo`} domain={opt.logo.domain} fallback={opt.logo.fallback} />
                        <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                        <span className="absolute right-2">
                          <SelectPrimitive.ItemIndicator>
                            <CheckIcon className="size-3.5 text-[#2d6b4e]" />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                      </SelectPrimitive.Item>
                    ))}
                  </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
              </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          </div>

          {/* Bank selection */}
          {isBankTransfer && (
            <div className="space-y-1.5">
              <p className={labelClass}>Select Bank</p>
              <SelectPrimitive.Root value={bankName} onValueChange={setBankName}>
                <SelectPrimitive.Trigger className={triggerClass}>
                  <div className="flex items-center gap-2">
                    {selectedBank ? (
                      <>
                        <BrandLogo alt={`${selectedBank.label} logo`} domain={selectedBank.domain} fallback={selectedBank.fallback} />
                        <span>{selectedBank.label}</span>
                      </>
                    ) : (
                      <span className="text-[#b0bfb8]">Choose your bank</span>
                    )}
                  </div>
                  <SelectPrimitive.Icon asChild>
                    <ChevronDownIcon className="size-4 text-[#87938b]" />
                  </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                  <SelectPrimitive.Content
                    position="popper"
                    className="z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-xl border border-[#d1ddd6] bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                  >
                    <SelectPrimitive.Viewport className="p-1">
                      {PAKISTANI_BANKS.map((bank) => (
                        <SelectPrimitive.Item
                          key={bank.value}
                          value={bank.value}
                          className="relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#1e3d2e] outline-none data-[highlighted]:bg-[#f4f7f5]"
                        >
                          <BrandLogo alt={`${bank.label} logo`} domain={bank.domain} fallback={bank.fallback} />
                          <SelectPrimitive.ItemText>{bank.label}</SelectPrimitive.ItemText>
                          <span className="absolute right-2">
                            <SelectPrimitive.ItemIndicator>
                              <CheckIcon className="size-3.5 text-[#2d6b4e]" />
                            </SelectPrimitive.ItemIndicator>
                          </span>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              </SelectPrimitive.Root>
            </div>
          )}

          {/* Account holder name */}
          <div className="space-y-1.5">
            <p className={labelClass}>Account Holder Name</p>
            <input
              className={inputClass}
              placeholder="Full name (exactly as in bank records)"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
            />
          </div>

          {/* Account details */}
          {isBankTransfer ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className={labelClass}>Account Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["iban", "number"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setAccountType(type); setAccountDetails(""); }}
                      className={`h-9 rounded-xl border-2 text-xs font-bold transition-all ${
                        accountType === type
                          ? "border-[#2d6b4e] bg-[#e4f1e8] text-[#1e5c3e]"
                          : "border-[#dce6df] bg-white text-[#7a8f82] hover:border-[#b0c5ba]"
                      }`}
                    >
                      {type === "iban" ? "IBAN (Preferred)" : "Account Number"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>{accountType === "iban" ? "IBAN Number" : "Account Number"}</p>
                <input
                  className={inputClass}
                  placeholder={accountType === "iban" ? "PK36ABCD0123456789012345" : "Account number (16-18 digits)"}
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className={labelClass}>Mobile / Wallet Number</p>
              <input
                className={inputClass}
                placeholder="03001234567 or +923001234567"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 border-t border-[#e8eeed] px-5 pb-5 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="h-10 flex-1 rounded-full border-2 border-[#d1ddd6] bg-white text-sm font-bold text-[#496159] transition-colors hover:border-[#b0c5ba] hover:bg-[#f4f7f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-10 flex-1 rounded-full bg-[#2d6b4e] text-sm font-bold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
          >
            {isLoading ? "Adding…" : "Add Method"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
