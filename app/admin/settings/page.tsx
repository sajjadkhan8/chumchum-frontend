'use client';

import { useEffect, useState } from 'react';
import { Bell, Moon, ShieldCheck, ShieldOff, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { apiClient } from '@/lib/api/client';
import { adminService, type AdminApiLog } from '@/services/admin.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationPreferences {
  emailOnDisputeOpened: boolean;
  emailOnWithdrawalPending: boolean;
}

type MfaPhase = 'idle' | 'setup' | 'disable';

export default function AdminSettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, restoreSession } = useAuthStore();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailOnDisputeOpened: true,
    emailOnWithdrawalPending: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // MFA state
  const [mfaPhase, setMfaPhase] = useState<MfaPhase>('idle');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaUri, setMfaUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const [logs, setLogs] = useState<AdminApiLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logServiceFilter, setLogServiceFilter] = useState('all');
  const [logStatusFilter, setLogStatusFilter] = useState('all');

  const loadLogs = async () => {
    setLogsLoading(true);
    const result = await adminService.getApiLogs({
      service: logServiceFilter !== 'all' ? logServiceFilter : undefined,
      status: logStatusFilter !== 'all' ? (logStatusFilter as 'success' | 'error') : undefined,
      limit: 50,
    });
    setLogs(result.logs);
    setLogsLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadLogs(); }, [logServiceFilter, logStatusFilter]);

  const startSetupMfa = async () => {
    setMfaLoading(true);
    try {
      const { secret, otpAuthUri } = await authService.setupMfa();
      setMfaSecret(secret);
      setMfaUri(otpAuthUri);
      setTotpCode('');
      setMfaPhase('setup');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start MFA setup');
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmEnableMfa = async () => {
    if (totpCode.length !== 6) { toast.error('Enter the 6-digit code from your authenticator app'); return; }
    setMfaLoading(true);
    try {
      await authService.enableMfa(totpCode);
      await restoreSession();
      setMfaPhase('idle');
      setTotpCode('');
      toast.success('MFA enabled — your account now requires a TOTP code at login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not enable MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  const confirmDisableMfa = async () => {
    if (totpCode.length !== 6) { toast.error('Enter the 6-digit code from your authenticator app'); return; }
    setMfaLoading(true);
    try {
      await authService.disableMfa(totpCode);
      await restoreSession();
      setMfaPhase('idle');
      setTotpCode('');
      toast.success('MFA disabled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not disable MFA');
    } finally {
      setMfaLoading(false);
    }
  };

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

      {/* MFA Card */}
      <div className="rounded-2xl border border-[#e2e7e1] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Security</p>
            <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Two-factor authentication</h2>
          </div>
          <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold ${user?.mfaEnabled ? 'bg-[#e7f0ea] text-[#185c39]' : 'bg-[#f4f2e9] text-[#87938b]'}`}>
            {user?.mfaEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {mfaPhase === 'idle' && (
          <div className="space-y-3">
            <p className="text-[13px] text-[#496159]">
              {user?.mfaEnabled
                ? 'Your account is protected with TOTP-based two-factor authentication. Login requires a 6-digit code from your authenticator app.'
                : 'Add a second layer of security. After setup, logging in requires a 6-digit code from an authenticator app (Google Authenticator, Authy, etc.).'}
            </p>
            {user?.mfaEnabled ? (
              <button
                onClick={() => { setTotpCode(''); setMfaPhase('disable'); }}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-700 transition hover:bg-red-100"
              >
                <ShieldOff className="size-4" /> Disable MFA
              </button>
            ) : (
              <button
                onClick={() => void startSetupMfa()}
                disabled={mfaLoading}
                className="flex items-center gap-2 rounded-xl bg-[#2d6b4e] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              >
                {mfaLoading ? <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <ShieldCheck className="size-4" />}
                Set up MFA
              </button>
            )}
          </div>
        )}

        {mfaPhase === 'setup' && (
          <div className="space-y-4">
            <p className="text-[13px] text-[#496159]">
              Scan the URI below in your authenticator app, or enter the secret manually, then confirm with the 6-digit code.
            </p>
            <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#87938b]">Manual entry secret</p>
              <p className="font-mono text-base font-bold tracking-wider text-[#1e3d2e] break-all">{mfaSecret}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#87938b] mt-3">Auth URI (scan or paste)</p>
              <p className="font-mono text-[11px] text-[#496159] break-all">{mfaUri}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#87938b]">Confirm with TOTP code</p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-10 max-w-[180px] rounded-xl border-[#cddad1] font-mono text-center text-lg tracking-[0.4em]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void confirmEnableMfa()}
                disabled={mfaLoading || totpCode.length !== 6}
                className="flex items-center gap-2 rounded-xl bg-[#2d6b4e] px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
              >
                {mfaLoading ? <div className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : null}
                Verify &amp; enable
              </button>
              <button onClick={() => { setMfaPhase('idle'); setTotpCode(''); }} className="rounded-xl border border-[#d1ddd6] px-4 py-2.5 text-[13px] font-bold text-[#496159] hover:bg-[#f4f2e9]">
                Cancel
              </button>
            </div>
          </div>
        )}

        {mfaPhase === 'disable' && (
          <div className="space-y-4">
            <p className="text-[13px] text-[#496159]">Enter your current TOTP code to confirm you want to disable MFA.</p>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#87938b]">Current TOTP code</p>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-10 max-w-[180px] rounded-xl border-[#cddad1] font-mono text-center text-lg tracking-[0.4em]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void confirmDisableMfa()}
                disabled={mfaLoading || totpCode.length !== 6}
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-bold text-red-700 disabled:opacity-50"
              >
                {mfaLoading ? <div className="size-4 animate-spin rounded-full border-2 border-red-200/20 border-t-red-700" /> : null}
                Disable MFA
              </button>
              <button onClick={() => { setMfaPhase('idle'); setTotpCode(''); }} className="rounded-xl border border-[#d1ddd6] px-4 py-2.5 text-[13px] font-bold text-[#496159] hover:bg-[#f4f2e9]">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Integration Logs */}
      <div className="mt-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#173b2a]">Integration Logs</h2>
            <p className="text-sm text-muted-foreground">Recent API calls, webhook deliveries, and integration errors.</p>
          </div>
          <div className="flex gap-2">
            <Select value={logServiceFilter} onValueChange={setLogServiceFilter}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                <SelectItem value="safepay">Safepay</SelectItem>
                <SelectItem value="oauth">OAuth</SelectItem>
                <SelectItem value="webhook">Webhooks</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
            <Select value={logStatusFilter} onValueChange={setLogStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-[#d9e0d8] bg-white">
          {logsLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading logs…</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No integration logs found.</div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const isError = log.statusCode >= 400 || !!log.errorMessage;
                return (
                  <div key={log.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <Badge variant={isError ? 'destructive' : 'secondary'} className="shrink-0 font-mono text-xs">
                      {log.statusCode}
                    </Badge>
                    <span className="font-mono text-xs font-bold text-[#173b2a]">{log.method}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-[#647168]">{log.path}</span>
                    <span className="shrink-0 text-xs text-[#9ba8a1]">{log.durationMs}ms</span>
                    <Badge variant="outline" className="shrink-0 text-xs capitalize">{log.service}</Badge>
                    <span className="shrink-0 text-xs text-[#9ba8a1]">
                      {new Date(log.timestamp).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                    {log.errorMessage ? (
                      <span className="w-full text-xs text-red-600">{log.errorMessage}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
