'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';
import { isPasswordStrong, PASSWORD_REQUIREMENTS_MESSAGE } from '@/lib/password-validation';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing a token. Request a new password reset email.');
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setResetComplete(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isExpiredOrInvalid = /expir|invalid|not found/i.test(msg);
      setError(
        isExpiredOrInvalid
          ? `${msg} — use the link below to request a new reset email.`
          : msg || 'Could not reset password. The link may have expired.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none transition-colors duration-150 focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0';
  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]';

  return (
    <AuthShell
      eyebrow="Account Recovery"
      title="Create a new password."
      description="Enter a new secure password for your ZingZing account."
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">New password</p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">
            Create a new password.
          </h2>
          <p className="mt-1 text-sm text-[#6b7870]">{PASSWORD_REQUIREMENTS_MESSAGE}</p>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {resetComplete ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-[#d1f0e0] bg-[#f0faf5] px-3.5 py-2.5 text-sm text-[#1e5c3e]">
              Your password has been updated.
            </p>
            <Link
              href="/login"
              className="flex h-10 w-full items-center justify-center rounded-full bg-[#2d6b4e] text-sm font-bold text-white transition-colors hover:bg-[#1f5239]"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-1.5">
              <p className={labelClass}>New password</p>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className={inputClass + ' pr-10'}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87938b] hover:text-[#2d6b4e] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className={labelClass}>Confirm new password</p>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  className={inputClass + ' pr-10'}
                  placeholder="Repeat the new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#87938b] hover:text-[#2d6b4e] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 w-full rounded-full bg-[#2d6b4e] text-sm font-bold text-white transition-colors hover:bg-[#1f5239] disabled:opacity-60"
            >
              {isLoading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <Link href="/forgot-password" className="inline-flex items-center text-sm font-bold text-[#2d6b4e] hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Request a new link
        </Link>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
