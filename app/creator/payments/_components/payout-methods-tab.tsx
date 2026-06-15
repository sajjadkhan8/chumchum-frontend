"use client";

import { Check, ChevronDown, Copy, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AddPayoutMethodModal, BrandLogo, PAKISTANI_BANKS, PAYOUT_METHOD_LOGOS } from "@/components/add-payout-method-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const panelClass = "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";

  if (payoutMethods.length === 0) {
    return (
      <Card className={panelClass}>
        <CardContent className="pt-6">
          <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] px-5 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#e6eceb] text-[#2d6b4e]"><CreditCard className="size-5" /></span>
            <h3 className="mt-4 text-sm font-extrabold text-[#1e3d2e]">No payout methods added yet</h3>
            <p className="mb-4 mt-1 text-xs text-[#718077]">
              Add your first payout method to start receiving earnings
            </p>
            <AddPayoutMethodModal
              isOpen={showAddMethodDialog}
              onOpenChange={onOpenAddMethodDialogChange}
              onAddMethod={onAddMethod}
              isLoading={isAddingMethod}
              triggerButtonVariant="default"
              showTriggerButton={true}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={panelClass}>
      <CardHeader className="flex flex-row items-end justify-between gap-4 pb-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Where money lands</p>
          <CardTitle className="mt-1.5 text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">Connected methods</CardTitle>
        </div>
        <AddPayoutMethodModal
          isOpen={showAddMethodDialog}
          onOpenChange={onOpenAddMethodDialogChange}
          onAddMethod={onAddMethod}
          isLoading={isAddingMethod}
          triggerButtonVariant="default"
          showTriggerButton={true}
        />
      </CardHeader>
      <CardContent className="space-y-3">
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
                <div className="space-y-3 border-t border-[#cbd7cd] bg-white/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Account Holder</p>
                      <p className="font-medium">{method.name || "Not specified"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {String(method.type).toUpperCase() === "BANK_TRANSFER"
                          ? "IBAN / Account Number"
                          : "Account Details"}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-background px-2 py-1 text-xs font-mono">
                          {method.accountDetails}
                        </code>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigator.clipboard.writeText(method.accountDetails);
                            toast.success("Copied to clipboard");
                          }}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Copy account details"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!method.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onSetDefault(method.id);
                        }}
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteMethod(method.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
