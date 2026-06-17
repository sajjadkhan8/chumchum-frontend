'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authService } from '@/services/auth.service';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
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
      setError(err instanceof Error ? err.message : 'Could not reset password');
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
      title={token ? 'Create a new password.' : 'Reset your password.'}
      description={
        token
          ? 'Enter a new secure password for your ZingZing account.'
          : 'Enter your account email and we\'ll send you a password reset link.'
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">
            {token ? 'New password' : 'Password reset'}
          </p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">
            {token ? 'Create a new password.' : 'Forgot your password?'}
          </h2>
          <p className="mt-1 text-sm text-[#6b7870]">
            {token
              ? 'Choose something secure — at least 8 characters.'
              : "No worries. We'll send a reset link to your email."}
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {token ? (
          resetComplete ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-[#d1f0e0] bg-[#f0faf5] px-3.5 py-2.5 text-sm text-[#1e5c3e]">
                Your password has been updated.
              </p>
              <button
                onClick={() => (window.location.href = '/login')}
                className="h-10 w-full rounded-full bg-[#2d6b4e] text-sm font-bold text-white hover:bg-[#1f5239] transition-colors"
              >
                Sign in
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="space-y-1.5">
                <p className={labelClass}>New password</p>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <p className={labelClass}>Confirm new password</p>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="Repeat the new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 w-full rounded-full bg-[#2d6b4e] text-sm font-bold text-white hover:bg-[#1f5239] transition-colors disabled:opacity-60"
              >
                {isLoading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )
        ) : !submitted ? (
          <form className="space-y-4" onSubmit={handleForgotPassword}>
            <div className="space-y-1.5">
              <p className={labelClass}>Account email</p>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                <Input
                  id="email"
                  type="email"
                  required
                  className={inputClass + ' pl-10'}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 w-full rounded-full bg-[#2d6b4e] text-sm font-bold text-white hover:bg-[#1f5239] transition-colors disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="rounded-xl border border-[#d1f0e0] bg-[#f0faf5] px-3.5 py-2.5 text-sm text-[#1e5c3e]">
              If an account exists for{' '}
              <span className="font-bold">{email}</span>, a reset link has been sent.
            </p>
            <button
              onClick={() => (window.location.href = '/login')}
              className="h-10 w-full rounded-full border-2 border-[#dce6df] bg-white text-sm font-bold text-[#2d6b4e] hover:border-[#2d6b4e] transition-colors"
            >
              Back to login
            </button>
          </div>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#6b7870] hover:text-[#2d6b4e] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Return to login
        </Link>
      </div>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbfaf5]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
