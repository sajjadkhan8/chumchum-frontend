'use client';

import { useState } from 'react';
import { Bell, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { apiClient } from '@/lib/api/client';

interface NotificationPreferences {
  emailOnDisputeOpened: boolean;
  emailOnWithdrawalPending: boolean;
}

export default function AdminSettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailOnDisputeOpened: true,
    emailOnWithdrawalPending: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      await apiClient.put('/api/v1/users/me/notification-preferences', prefs);
      toast.success('Preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-[#496159]">Appearance and notification preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance Card */}
        <div className="rounded-2xl border border-[#e2e7e1] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
              {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Display</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Appearance</h2>
            </div>
          </div>

          <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-[#1e3d2e]">Dark mode</p>
                <p className="mt-0.5 text-[11px] text-[#87938b]">Switch between light and dark theme.</p>
              </div>
              <Switch
                checked={resolvedTheme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="rounded-2xl border border-[#e2e7e1] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Alerts</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Notifications</h2>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-[#1e3d2e]">New dispute opened</p>
                  <p className="mt-0.5 text-[11px] text-[#87938b]">Email when a new dispute case is created.</p>
                </div>
                <Switch
                  checked={prefs.emailOnDisputeOpened}
                  onCheckedChange={(v) => updatePref('emailOnDisputeOpened', v)}
                  aria-label="Email on dispute opened"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[13px] font-semibold text-[#1e3d2e]">Pending withdrawal</p>
                  <p className="mt-0.5 text-[11px] text-[#87938b]">Email when a creator requests a payout.</p>
                </div>
                <Switch
                  checked={prefs.emailOnWithdrawalPending}
                  onCheckedChange={(v) => updatePref('emailOnWithdrawalPending', v)}
                  aria-label="Email on withdrawal pending"
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={savePreferences}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] py-3 text-[13px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Saving…
                  </>
                ) : (
                  'Save preferences'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
