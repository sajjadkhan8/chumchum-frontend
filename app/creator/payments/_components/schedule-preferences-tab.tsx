"use client";

import { ChevronDownIcon, CheckIcon, Info, Save } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Switch } from "@/components/ui/switch";
import type { CreatorPayoutSchedule } from "@/services/payments.service";
import type { SchedulePreferencesTabProps } from "./types";

const panelClass =
  "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6";

const inputClass =
  "h-11 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none outline-none transition-colors focus:border-[#2d6b4e]";

const triggerClass =
  "flex h-11 w-full items-center justify-between gap-2 rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] outline-none transition-colors focus:border-[#2d6b4e]";

const contentClass =
  "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#d1ddd6] bg-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95";

const itemClass =
  "relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm text-[#1e3d2e] outline-none data-[highlighted]:bg-[#f4f7f5]";

function StyledSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className={triggerClass}>
        <span className={selected ? "text-[#1e3d2e]" : "text-[#b0bfb8]"}>
          {selected ? selected.label : (placeholder ?? "Select…")}
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="size-4 shrink-0 text-[#87938b]" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" className={contentClass}>
          <SelectPrimitive.Viewport className="p-1">
            {options.map((opt) => (
              <SelectPrimitive.Item key={opt.value} value={opt.value} className={itemClass}>
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
  );
}

const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]";

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">{title}</h2>
    </div>
  );
}

export function SchedulePreferencesTab({
  payoutPreferences,
  setPayoutPreferences,
  isSaving,
  onSavePreferences,
}: SchedulePreferencesTabProps) {
  return (
    <>
      {/* Payout schedule */}
      <div className={panelClass}>
        <SectionHeader eyebrow="Timing" title="Payout schedule" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className={labelClass}>Withdrawal Schedule</p>
            <StyledSelect
              value={payoutPreferences.payoutSchedule}
              onValueChange={(v) => setPayoutPreferences((prev) => ({ ...prev, payoutSchedule: v as CreatorPayoutSchedule }))}
              options={[
                { value: "manual", label: "Manual — withdraw anytime" },
                { value: "weekly", label: "Weekly — every Monday" },
                { value: "biweekly", label: "Bi-weekly" },
                { value: "monthly", label: "Monthly — 1st of month" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <p className={labelClass}>Minimum Payout Threshold (PKR)</p>
            <StyledSelect
              value={String(payoutPreferences.minimumPayoutAmount)}
              onValueChange={(v) => setPayoutPreferences((prev) => ({ ...prev, minimumPayoutAmount: Number(v) }))}
              options={[
                { value: "1000", label: "PKR 1,000" },
                { value: "2500", label: "PKR 2,500" },
                { value: "5000", label: "PKR 5,000" },
                { value: "10000", label: "PKR 10,000" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Account information */}
      <div className={panelClass}>
        <SectionHeader eyebrow="Identity" title="Account information" />
        <div className="space-y-1.5">
          <p className={labelClass}>Account Holder Name</p>
          <input
            className={inputClass}
            placeholder="Your full name"
            value={payoutPreferences.accountHolderName ?? ""}
            onChange={(e) =>
              setPayoutPreferences((prev) => ({
                ...prev,
                accountHolderName: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {/* Tax & compliance */}
      <div className={panelClass}>
        <SectionHeader eyebrow="Verification" title="Tax & compliance" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className={labelClass}>CNIC Number (Last 4 Digits)</p>
            <input
              className={inputClass}
              placeholder="1234"
              maxLength={4}
              value={payoutPreferences.cnicLast4 ?? ""}
              onChange={(e) =>
                setPayoutPreferences((prev) => ({
                  ...prev,
                  cnicLast4: e.target.value.replace(/\D/g, ""),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <p className={labelClass}>NTN (Optional)</p>
            <input
              className={inputClass}
              placeholder="For filer status"
              value={payoutPreferences.ntnNumber ?? ""}
              onChange={(e) =>
                setPayoutPreferences((prev) => ({
                  ...prev,
                  ntnNumber: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2 rounded-2xl bg-[#fdf3dc] p-3.5 text-xs leading-5 text-[#73541e]">
          <Info className="mt-0.5 size-4 shrink-0 text-[#9b6712]" />
          <p>
            Per FBR rules, WHT is deducted at source. Filers: 10% · Non-filers: 15%. Add
            your NTN to confirm filer status and save 5%.
          </p>
        </div>
      </div>

      {/* Payout preferences */}
      <div className={panelClass}>
        <SectionHeader eyebrow="Automation" title="Payout preferences" />
        <div className="space-y-3">
          {[
            {
              key: "autoWithdrawEnabled" as const,
              label: "Instant withdrawal",
              sub: "Use mobile wallet for immediate transfers (daily limits apply)",
            },
            {
              key: "earningsNotificationsEnabled" as const,
              label: "Earnings notifications",
              sub: "SMS + push when a payment clears into your balance",
            },
            {
              key: "weeklyDigestEnabled" as const,
              label: "Weekly earnings digest",
              sub: "Email summary every Sunday with your week's earnings",
            },
          ].map(({ key, label, sub }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#d1ddd6] bg-[#f4f7f5] p-3.5"
            >
              <div>
                <p className="text-sm font-extrabold text-[#1e3d2e]">{label}</p>
                <p className="mt-0.5 text-xs text-[#87938b]">{sub}</p>
              </div>
              <Switch
                checked={payoutPreferences[key]}
                onCheckedChange={(checked) =>
                  setPayoutPreferences((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onSavePreferences}
        disabled={isSaving}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2d6b4e] font-extrabold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
      >
        <Save className="size-4" />
        {isSaving ? "Saving…" : "Save Preferences"}
      </button>
    </>
  );
}
