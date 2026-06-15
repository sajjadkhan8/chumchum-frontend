"use client";

import { ArrowUp, Clock3, CreditCard, Landmark, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const panelClass = "rounded-[1.6rem] border border-[#dce3dc] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";
  const inputClass = "h-11 rounded-xl border-[#d6ded7] bg-[#fbfaf5] shadow-none focus-visible:border-[#185c39] focus-visible:ring-[#185c39]/15";

  return (
    <>
      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Transfer funds</p>
          <CardTitle className="text-xl font-extrabold tracking-[-0.035em] text-[#173b2a]">Request a withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#185c39] p-4 text-white">
              <Wallet className="size-4 text-[#f0c56e]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c9dace]">Available balance</p>
              <p className="mt-1 text-xl font-extrabold tracking-[-0.03em]">
                {formatPrice(availableBalance)}
              </p>
            </div>
            <div className="rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-4">
              <Landmark className="size-4 text-[#185c39]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#87938b]">Minimum withdrawal</p>
              <p className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#173b2a]">{formatPrice(1000)}</p>
            </div>
            <div className="rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-4">
              <Clock3 className="size-4 text-[#b77a12]" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#87938b]">Estimated arrival</p>
              <p className="mt-1 text-xs font-extrabold leading-5 text-[#173b2a]">Wallet: instant<br />Bank: 1-3 days</p>
            </div>
          </div>

          {payoutMethods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#ccd7ce] bg-[#fbfaf5] p-8 text-center">
              <CreditCard className="mx-auto size-5 text-[#b77a12]" />
              <p className="mt-3 text-sm font-extrabold text-[#173b2a]">Add a payout method to withdraw funds</p>
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
              <div className="space-y-4 rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-4 sm:p-5">
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
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#185c39] hover:bg-[#eef2eb] hover:text-[#185c39]"
                      onClick={() => onApplyQuickAmount(0.25)}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#185c39] hover:bg-[#eef2eb] hover:text-[#185c39]"
                      onClick={() => onApplyQuickAmount(0.5)}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-[#ccd7ce] bg-white text-xs font-bold text-[#526259] hover:border-[#185c39] hover:bg-[#eef2eb] hover:text-[#185c39]"
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

              <div className="space-y-3 rounded-2xl border border-[#dce3dc] bg-[#f4f2e9] p-4 sm:p-5">
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
                  className="mt-2 h-11 w-full rounded-full bg-[#185c39] font-extrabold text-white hover:bg-[#104b2d]"
                  onClick={onRequestWithdrawal}
                  disabled={isWithdrawing || availableBalance <= 0}
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
          <CardTitle className="text-xl font-extrabold tracking-[-0.035em] text-[#173b2a]">Recent withdrawals</CardTitle>
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
                <div key={withdrawal.id} className="flex items-center justify-between rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-3.5">
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
