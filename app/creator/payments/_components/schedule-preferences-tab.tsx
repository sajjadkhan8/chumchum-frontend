"use client";

import { Info, Save } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import type { CreatorPayoutSchedule } from "@/services/payments.service";
import type { SchedulePreferencesTabProps } from "./types";

export function SchedulePreferencesTab({
  payoutPreferences,
  setPayoutPreferences,
  isSaving,
  onSavePreferences,
}: SchedulePreferencesTabProps) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Withdrawal Schedule</Label>
              <Select
                value={payoutPreferences.payoutSchedule}
                onValueChange={(value) =>
                  setPayoutPreferences((preferences) => ({
                    ...preferences,
                    payoutSchedule: value as CreatorPayoutSchedule,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual — withdraw anytime</SelectItem>
                  <SelectItem value="weekly">Weekly — every Monday</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly — 1st of month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimum Payout Threshold (PKR)</Label>
              <Select
                value={String(payoutPreferences.minimumPayoutAmount)}
                onValueChange={(value) =>
                  setPayoutPreferences((preferences) => ({
                    ...preferences,
                    minimumPayoutAmount: Number(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">PKR 1,000</SelectItem>
                  <SelectItem value="2500">PKR 2,500</SelectItem>
                  <SelectItem value="5000">PKR 5,000</SelectItem>
                  <SelectItem value="10000">PKR 10,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account Holder Name</Label>
            <Input
              placeholder="Your full name"
              value={payoutPreferences.accountHolderName}
              onChange={(event) =>
                setPayoutPreferences((preferences) => ({
                  ...preferences,
                  accountHolderName: event.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax & Compliance (FBR)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>CNIC Number (Last 4 Digits)</Label>
              <Input
                placeholder="1234"
                value={payoutPreferences.cnicLast4}
                onChange={(event) =>
                  setPayoutPreferences((preferences) => ({
                    ...preferences,
                    cnicLast4: event.target.value.replace(/\D/g, ""),
                  }))
                }
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label>NTN (Optional)</Label>
              <Input
                placeholder="For filer status"
                value={payoutPreferences.ntnNumber}
                onChange={(event) =>
                  setPayoutPreferences((preferences) => ({
                    ...preferences,
                    ntnNumber: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Per FBR rules, WHT is deducted at source. Filers: 10% · Non-filers: 15%. Add
              your NTN to confirm filer status and save 5%.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payout Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">Instant withdrawal</p>
              <p className="text-sm text-muted-foreground">
                Use mobile wallet for immediate transfers (daily limits apply)
              </p>
            </div>
            <Switch
              checked={payoutPreferences.autoWithdrawEnabled}
              onCheckedChange={(checked) =>
                setPayoutPreferences((preferences) => ({
                  ...preferences,
                  autoWithdrawEnabled: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">Earnings notifications</p>
              <p className="text-sm text-muted-foreground">
                SMS + push when a payment clears into your balance
              </p>
            </div>
            <Switch
              checked={payoutPreferences.earningsNotificationsEnabled}
              onCheckedChange={(checked) =>
                setPayoutPreferences((preferences) => ({
                  ...preferences,
                  earningsNotificationsEnabled: checked,
                }))
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">Weekly earnings digest</p>
              <p className="text-sm text-muted-foreground">
                Email summary every Sunday with your week's earnings
              </p>
            </div>
            <Switch
              checked={payoutPreferences.weeklyDigestEnabled}
              onCheckedChange={(checked) =>
                setPayoutPreferences((preferences) => ({
                  ...preferences,
                  weeklyDigestEnabled: checked,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSavePreferences} disabled={isSaving} className="w-full">
        {isSaving ? (
          "Saving..."
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Preferences
          </>
        )}
      </Button>
    </>
  );
}

