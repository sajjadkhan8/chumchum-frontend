"use client";

import { ArrowUp, Clock3, CreditCard, Landmark, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatorMetricCard } from "@/components/creator-metric-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddPayoutMethodModal } from "@/components/add-payout-method-modal";
import { formatDate, formatPrice } from "@/lib/utils";
import type { WithdrawTabProps } from "./types";

export function WithdrawTab({
  earnings,
  payoutMethods,
  withdrawals,
  withdrawAmount,
  withdrawMethodId,
  isWithdrawing,
  isAddingMethod,
  showAddMethodDialog,
  onAddMethod,
  onOpenAddMethodDialogChange,
  onWithdrawAmountChange,
  onWithdrawMethodChange,
  onApplyQuickAmount,
  onRequestWithdrawal,
  maskAccountDetails,
}: WithdrawTabProps) {
  const availableBalance = earnings?.availableBalance || 0;
  const requestedAmount = Number(withdrawAmount) || 0;
  const panelClass = "rounded-[1.6rem] border border-[#d1ddd6] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";
  const inputClass = "h-11 rounded-xl border-[#cddad1] bg-[#fbfaf5] shadow-none focus-visible:border-[#2d6b4e] focus-visible:ring-[#2d6b4e]/15";

  return (
    <>
      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Transfer funds</p>
          <CardTitle className="text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">Request a withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <CreatorMetricCard dark title="Available balance" value={formatPrice(availableBalance)} sub="ready to transfer" Icon={Wallet} />
            <CreatorMetricCard title="Minimum withdrawal" value={formatPrice(1000)} sub="per request" Icon={Landmark} />
            <CreatorMetricCard gold title="Estimated arrival" value={<span className="text-base leading-5">Wallet: instant<br />Bank: 1-3 days</span>} sub="after approval" Icon={Clock3} />
          </div>

          {payoutMethods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] p-8 text-center">
              <CreditCard className="mx-auto size-5 text-[#b77a12]" />
              <p className="mt-3 text-sm font-extrabold text-[#1e3d2e]">Add a payout method to withdraw funds</p>
              <p className="mt-1 text-xs text-[#718077]">
                Connect JazzCash, Easypaisa, or a bank account first.
              </p>
              <AddPayoutMethodModal
                isOpen={showAddMethodDialog}
                onOpenChange={onOpenAddMethodDialogChange}
                onAddMethod={onAddMethod}
                isLoading={isAddingMethod}
                showTriggerButton={true}
              />
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="space-y-4 rounded-2xl border border-[#d1ddd6] bg-[#fbfaf5] p-4 sm:p-5">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (PKR)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min="1000"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(event) => onWithdrawAmountChange(event.target.value)}
                    className={inputClass}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#2d6b4e] hover:bg-[#e6eceb] hover:text-[#2d6b4e]"
                      onClick={() => onApplyQuickAmount(0.25)}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#2d6b4e] hover:bg-[#e6eceb] hover:text-[#2d6b4e]"
                      onClick={() => onApplyQuickAmount(0.5)}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#2d6b4e] hover:bg-[#e6eceb] hover:text-[#2d6b4e]"
                      onClick={() => onApplyQuickAmount(1)}
                    >
                      100%
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payout Method</Label>
                  <Select value={withdrawMethodId} onValueChange={onWithdrawMethodChange}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select payout method" />
                    </SelectTrigger>
                    <SelectContent>
                      {payoutMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.displayName} ({maskAccountDetails(method.type, method.accountDetails)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#d1ddd6] bg-[#f4f2e9] p-4 sm:p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#b77a12]">Review transfer</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requested amount</span>
                  <span className="font-medium">{formatPrice(requestedAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="font-medium">
                    {payoutMethods.find((method) => method.id === withdrawMethodId)?.displayName ||
                      "Select method"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available after request</span>
                  <span className="font-medium">
                    {formatPrice(Math.max(0, availableBalance - requestedAmount))}
                  </span>
                </div>
                <Button
                  className="mt-2 h-11 w-full rounded-full bg-[#2d6b4e] font-extrabold text-white hover:bg-[#1f5239]"
                  onClick={onRequestWithdrawal}
                  disabled={isWithdrawing || availableBalance <= 0 || requestedAmount <= 0 || requestedAmount > availableBalance || !withdrawMethodId}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  {isWithdrawing ? "Submitting..." : "Request Withdrawal"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Activity</p>
          <CardTitle className="text-xl font-extrabold tracking-[-0.035em] text-[#1e3d2e]">Recent withdrawals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] p-8 text-center text-xs font-semibold text-[#718077]">
              No withdrawals requested yet.
            </div>
          ) : (
            withdrawals.map((withdrawal) => {
              const method = payoutMethods.find((item) => item.id === withdrawal.payoutMethodId);
              return (
                <div key={withdrawal.id} className="flex items-center justify-between rounded-2xl border border-[#d1ddd6] bg-[#fbfaf5] p-3.5">
                  <div>
                    <p className="font-medium">{method?.displayName || "Payout method"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date(withdrawal.createdAt))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(withdrawal.amount)}</p>
                    <Badge variant="secondary" className="capitalize">
                      {withdrawal.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </>
  );
}
