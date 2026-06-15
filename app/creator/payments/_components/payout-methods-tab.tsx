"use client";

import { Check, ChevronDown, Copy, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddPayoutMethodModal, BrandLogo, PAKISTANI_BANKS, PAYOUT_METHOD_LOGOS } from "@/components/add-payout-method-modal";
import { Badge } from "@/components/ui/badge";
import type { PaymentMethodUI, PayoutMethodsTabProps } from "./types";

const getPayoutMethodLogo = (method: PaymentMethodUI) => {
  const normalizedType = String(method.type).toUpperCase();

  if (normalizedType === "BANK_TRANSFER") {
    const bank = PAKISTANI_BANKS.find((item) => item.value === method.bankName);
    if (bank) {
      return {
        alt: `${bank.label} logo`,
        domain: bank.domain,
        fallback: bank.fallback,
      };
    }
  }

  const methodLogo = PAYOUT_METHOD_LOGOS[normalizedType] || PAYOUT_METHOD_LOGOS.BANK_TRANSFER;
  return {
    alt: `${methodLogo.label} logo`,
    domain: methodLogo.domain,
    fallback: methodLogo.fallback,
  };
};

export function PayoutMethodsTab({
  payoutMethods,
  expandedMethods,
  isAddingMethod,
  showAddMethodDialog,
  onAddMethod,
  onOpenAddMethodDialogChange,
  onToggleMethodExpanded,
  onSetDefault,
  onDeleteMethod,
  maskAccountDetails,
}: PayoutMethodsTabProps) {
  const panelClass = "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)] p-5 sm:p-6";

  if (payoutMethods.length === 0) {
    return (
      <div className={panelClass}>
        <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] px-5 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e6eceb] text-[#2d6b4e]"><CreditCard className="size-5" /></span>
          <h3 className="mt-4 text-sm font-extrabold text-[#1e3d2e]">No payout methods added yet</h3>
          <p className="mb-5 mt-1 text-xs text-[#87938b]">
            Add your first payout method to start receiving earnings
          </p>
          <AddPayoutMethodModal
            isOpen={showAddMethodDialog}
            onOpenChange={onOpenAddMethodDialogChange}
            onAddMethod={onAddMethod}
            isLoading={isAddingMethod}
            showTriggerButton={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Where money lands</p>
          <h2 className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">Connected methods</h2>
        </div>
        <AddPayoutMethodModal
          isOpen={showAddMethodDialog}
          onOpenChange={onOpenAddMethodDialogChange}
          onAddMethod={onAddMethod}
          isLoading={isAddingMethod}
          showTriggerButton={true}
        />
      </div>
      <div className="space-y-3">
        {payoutMethods.map((method) => {
          const logo = getPayoutMethodLogo(method);
          const isExpanded = expandedMethods.has(method.id);

          return (
            <div
              key={method.id}
              className={`cursor-pointer rounded-2xl border transition-all ${
                isExpanded
                  ? "border-[#2d6b4e] bg-[#e6eceb]"
                  : "border-[#d1ddd6] bg-[#fbfaf5] hover:border-[#b0c5ba]"
              }`}
              onClick={() => onToggleMethodExpanded(method.id)}
            >
              <div className="flex items-center gap-3 p-3.5 sm:p-4">
                <BrandLogo alt={logo.alt} domain={logo.domain} fallback={logo.fallback} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-[#1e3d2e]">{method.displayName}</p>
                    {method.isDefault && (
                      <Badge className="rounded-full bg-[#2d6b4e] px-2 py-0.5 text-[9px] font-extrabold text-white">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#718077]">
                    {maskAccountDetails(method.type, method.accountDetails)} · Instant payout
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <Check className="size-4 text-[#2d6b4e]" />
                  ) : (
                    <ChevronDown className="size-4 text-[#87938b]" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 border-t border-[#e8eeed] bg-[#f4f7f5] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]">Account Holder</p>
                      <p className="text-sm font-bold text-[#1e3d2e]">{method.name || "Not specified"}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]">
                        {String(method.type).toUpperCase() === "BANK_TRANSFER" ? "IBAN / Account No." : "Account Details"}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg bg-white px-2.5 py-1 text-xs font-mono text-[#1e3d2e] border border-[#d1ddd6]">
                          {method.accountDetails}
                        </code>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigator.clipboard.writeText(method.accountDetails);
                            toast.success("Copied to clipboard");
                          }}
                          className="grid size-7 place-items-center rounded-lg border border-[#d1ddd6] bg-white text-[#87938b] transition-colors hover:border-[#2d6b4e] hover:text-[#2d6b4e]"
                          aria-label="Copy account details"
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); onSetDefault(method.id); }}
                        className="h-8 rounded-full border-2 border-[#2d6b4e] bg-white px-4 text-xs font-bold text-[#2d6b4e] transition-colors hover:bg-[#e4f1e8]"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); onDeleteMethod(method.id); }}
                      className="flex h-8 items-center gap-1.5 rounded-full border-2 border-[#d1ddd6] bg-white px-4 text-xs font-bold text-[#87938b] transition-colors hover:border-[#c0392b] hover:text-[#c0392b]"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
