'use client';

import { useState } from 'react';
import { KeyRound, Mail, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { authService } from '@/services/auth.service';
import { isPasswordStrong, PASSWORD_REQUIREMENTS_MESSAGE } from '@/lib/password-validation';

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isPasswordStrong(newPassword)) {
      toast.error(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.patch('/api/v1/users/me/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendEmailVerification = async () => {
    try {
      await authService.sendEmailVerification();
      toast.success('Verification email sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send verification email');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Admin Profile</h1>
        <p className="mt-1 text-sm text-[#496159]">Your identity and account credentials.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info Card */}
        <div className="rounded-2xl border border-[#e2e7e1] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
              <User className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Identity</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Account info</h2>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-[#2d6b4e] text-xl font-bold text-white">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[16px] font-bold text-[#1e3d2e]">{user.name}</p>
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#e8f0ec] px-3 py-1 text-[11px] font-bold text-[#2d6b4e]">
                  <Shield className="h-3 w-3" />
                  Platform Admin
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#87938b]">Email</p>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[#2d6b4e]" />
                  <span className="text-[14px] text-[#1e3d2e]">{user.email}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-[#e2e7e1] bg-[#fbfaf5] px-3 py-2">
                  <p className="text-[12px] font-semibold text-[#496159]">
                    {user.emailVerified ? 'Email verified' : 'Email not verified'}
                  </p>
                  {!user.emailVerified && (
                    <button
                      type="button"
                      onClick={() => void handleSendEmailVerification()}
                      className="rounded-lg border border-[#d1ddd6] px-2.5 py-1 text-[11px] font-bold text-[#2d6b4e] hover:bg-[#e8f0ec]"
                    >
                      Send email
                    </button>
                  )}
                </div>
              </div>
              {user.createdAt && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#87938b]">Member since</p>
                  <p className="mt-1 text-[14px] text-[#1e3d2e]">{formatDate(user.createdAt)}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#87938b]">User ID</p>
                <p className="mt-1 font-mono text-[11px] text-[#87938b]">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-[#e2e7e1] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e]">
              <KeyRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Security</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Change password</h2>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="current-password" className="text-[12px] font-semibold text-[#496159]">
                Current password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="border-[#d1ddd6] focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-password" className="text-[12px] font-semibold text-[#496159]">
                New password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="border-[#d1ddd6] focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirm-password" className="text-[12px] font-semibold text-[#496159]">
                Confirm new password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="border-[#d1ddd6] focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
              />
            </div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e6aa38] px-4 py-2.5 text-[13px] font-bold text-[#1e3d2e] transition hover:bg-[#f0bd58] disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-[#1e3d2e]/20 border-t-[#1e3d2e]" />
                  Updating…
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
