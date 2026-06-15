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
  const panelClass = "rounded-[1.6rem] border border-[#dce3dc] bg-white shadow-[0_18px_55px_rgba(38,70,50,0.07)]";
  const inputClass = "h-11 rounded-xl border-[#d6ded7] bg-[#fbfaf5] shadow-none focus-visible:border-[#185c39] focus-visible:ring-[#185c39]/15";
  const sectionTitle = "text-xl font-extrabold tracking-[-0.035em] text-[#173b2a]";

  return (
    <>
      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Timing</p>
          <CardTitle className={sectionTitle}>Payout schedule</CardTitle>
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
                <SelectTrigger className={inputClass}>
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
                <SelectTrigger className={inputClass}>
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

      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Identity</p>
          <CardTitle className={sectionTitle}>Account information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account Holder Name</Label>
            <Input
              placeholder="Your full name"
              value={payoutPreferences.accountHolderName}
              className={inputClass}
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

      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Verification</p>
          <CardTitle className={sectionTitle}>Tax & compliance</CardTitle>
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
                className={inputClass}
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
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex gap-2 rounded-2xl bg-[#f7e8c8] p-3.5 text-xs leading-5 text-[#73541e]">
            <Info className="mt-0.5 size-4 flex-shrink-0 text-[#9b6712]" />
            <p>
              Per FBR rules, WHT is deducted at source. Filers: 10% · Non-filers: 15%. Add
              your NTN to confirm filer status and save 5%.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={panelClass}>
        <CardHeader className="pb-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#b77a12]">Automation</p>
          <CardTitle className={sectionTitle}>Payout preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-3.5">
            <div>
              <p className="text-sm font-extrabold text-[#173b2a]">Instant withdrawal</p>
              <p className="mt-0.5 text-xs text-[#718077]">
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
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-3.5">
            <div>
              <p className="text-sm font-extrabold text-[#173b2a]">Earnings notifications</p>
              <p className="mt-0.5 text-xs text-[#718077]">
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
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-3.5">
            <div>
              <p className="text-sm font-extrabold text-[#173b2a]">Weekly earnings digest</p>
              <p className="mt-0.5 text-xs text-[#718077]">
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

      <Button onClick={onSavePreferences} disabled={isSaving} className="h-11 w-full rounded-full bg-[#185c39] font-extrabold text-white hover:bg-[#104b2d]">
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
