"use client";

import { ArrowUp } from "lucide-react";
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="mt-1 text-xl font-semibold text-green-600">
                {formatPrice(availableBalance)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Minimum Withdrawal</p>
              <p className="mt-1 text-xl font-semibold">{formatPrice(1000)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Estimated Arrival</p>
              <p className="mt-1 text-sm font-medium">
                Wallet: near-instant · Bank: 1-3 business days
              </p>
            </div>
          </div>

          {payoutMethods.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-center">
              <p className="font-medium">Add a payout method to withdraw funds</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount">Amount (PKR)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min="1000"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(event) => onWithdrawAmountChange(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyQuickAmount(0.25)}
                    >
                      25%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyQuickAmount(0.5)}
                    >
                      50%
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onApplyQuickAmount(1)}
                    >
                      100%
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payout Method</Label>
                  <Select value={withdrawMethodId} onValueChange={onWithdrawMethodChange}>
                    <SelectTrigger>
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

              <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium">Review</p>
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
                  className="mt-2 w-full"
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Withdrawals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {withdrawals.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
              No withdrawals requested yet.
            </div>
          ) : (
            withdrawals.map((withdrawal) => {
              const method = payoutMethods.find((item) => item.id === withdrawal.payoutMethodId);
              return (
                <div key={withdrawal.id} className="flex items-center justify-between rounded-lg border p-3">
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

