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
  if (payoutMethods.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold">No payout methods added yet</h3>
            <p className="mt-1 mb-4 text-sm text-muted-foreground">
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Connected Methods</CardTitle>
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
              className={`cursor-pointer rounded-lg border transition-all ${
                isExpanded
                  ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/20"
                  : "border-border hover:border-border/80"
              }`}
              onClick={() => onToggleMethodExpanded(method.id)}
            >
              <div className="flex items-center gap-3 p-4">
                <BrandLogo alt={logo.alt} domain={logo.domain} fallback={logo.fallback} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{method.displayName}</p>
                    {method.isDefault && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {maskAccountDetails(method.type, method.accountDetails)} · Instant payout
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-3 border-t border-green-200 bg-green-50/50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
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

