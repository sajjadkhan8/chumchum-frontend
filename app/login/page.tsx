'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';

const getDashboardPath = (role?: string) => {
  if (role === 'platform_admin') return '/admin/dashboard';
  return role === 'creator' ? '/creator/dashboard' : '/brand/dashboard';
};

const getAllowedPathPrefixes = (role?: string): string[] => {
  if (role === 'platform_admin') return ['/admin'];
  if (role === 'creator') return ['/creator'];
  if (role === 'brand') return ['/brand'];
  return [];
};

const getPostLoginPath = (role?: string) => {
  if (typeof window === 'undefined') return getDashboardPath(role);
  const nextPath = new URLSearchParams(window.location.search).get('next');
  if (nextPath?.startsWith('/') && !nextPath.startsWith('//')) {
    const allowed = getAllowedPathPrefixes(role);
    if (allowed.some((prefix) => nextPath.startsWith(prefix))) return nextPath;
  }
  return getDashboardPath(role);
};

const inputClass =
  'h-10 w-full rounded-xl border-2 border-[#dce6df] bg-white px-3.5 text-sm text-[#1e3d2e] placeholder:text-[#b0bfb8] shadow-none transition-colors duration-150 focus-visible:border-[#2d6b4e] focus-visible:ring-4 focus-visible:ring-[#2d6b4e]/8 focus-visible:ring-offset-0';
const primaryButtonClass =
  'h-10 w-full rounded-full bg-[#2d6b4e] text-sm font-bold text-white hover:bg-[#1f5239] transition-colors';
const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-[#7a8f82]';

export default function LoginPage() {
  const router = useRouter();
  const {
    login, loginWithGoogle, loginWithPhone, requestOtp,
    loginWithMfa, clearMfaChallenge, mfaChallengeToken,
    isLoading, user, isAuthenticated, hasHydrated,
  } = useAuthStore();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [googleRole, setGoogleRole] = useState<UserRole>('creator');
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role) router.replace(getPostLoginPath(user.role));
  }, [hasHydrated, isAuthenticated, user, router]);

  if (hasHydrated && isAuthenticated && user?.role) {
    return <div className="grid min-h-screen place-items-center bg-[#fbfaf5]"><Loader2 className="size-6 animate-spin text-[#2d6b4e]" /></div>;
  }

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await login(email, password);
      // If MFA is required the store sets mfaChallengeToken and returns — no redirect yet.
      if (!useAuthStore.getState().mfaChallengeToken) {
        toast.success('Welcome back!', { id: 'login-success' });
        router.push(getPostLoginPath(useAuthStore.getState().user?.role));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      submittingRef.current = false;
    }
  };

  const handleSendOtp = async () => {
    if (!phone) return toast.error('Please enter your phone number');
    try {
      await requestOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send OTP');
    }
  };

  const handlePhoneLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await loginWithPhone(phone, otp);
      toast.success('Welcome back!', { id: 'login-success' });
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid OTP');
    } finally {
      submittingRef.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await loginWithGoogle(googleRole);
      toast.success('Welcome back!', { id: 'login-success' });
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google login failed');
    } finally {
      submittingRef.current = false;
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mfaChallengeToken || submittingRef.current) return;
    if (totpCode.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app');
      return;
    }
    submittingRef.current = true;
    try {
      await loginWithMfa(mfaChallengeToken, totpCode);
      toast.success('Welcome back!', { id: 'login-success' });
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      setTotpCode('');
      toast.error(error instanceof Error ? error.message : 'Invalid authenticator code');
    } finally {
      submittingRef.current = false;
    }
  };

  // MFA challenge step — shown instead of normal login forms
  if (mfaChallengeToken) {
    return (
      <AuthShell
        eyebrow="Two-factor authentication"
        title="One more step to keep your account secure."
        description="Enter the 6-digit code from your authenticator app to complete sign in."
        hideMobileHeader
      >
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e6eceb] text-[#2d6b4e]">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.04em] text-[#1e3d2e]">Verify your identity.</h2>
            <p className="mt-1 text-sm text-[#6b7870]">Open your authenticator app and enter the current code.</p>
          </div>
        </div>

        <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="totp" className={labelClass}>Authenticator code</Label>
            <Input
              id="totp"
              inputMode="numeric"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              required
              className={`${inputClass} text-center text-xl tracking-[0.5em] font-bold`}
            />
          </div>
          <Button type="submit" disabled={isLoading || totpCode.length !== 6} className={primaryButtonClass}>
            {isLoading ? <><Loader2 className="size-4 animate-spin" /> Verifying...</> : <>Verify and sign in <ArrowRight className="size-4" /></>}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => { clearMfaChallenge(); setTotpCode(''); }}
          className="mt-4 w-full text-center text-xs font-bold text-[#6b7870] hover:text-[#2d6b4e]"
        >
          Use a different account
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good work starts with the right connection."
      description="Pick up conversations, opportunities, and collaborations without losing the thread."
      hideMobileHeader
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Sign in</p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">Welcome back.</h2>
          <p className="mt-1 text-sm text-[#6b7870]">Continue to your ZingZing workspace.</p>
        </div>
        <span className="mt-1 hidden rounded-full bg-[#f7e8c8] px-3 py-1.5 text-[11px] font-bold text-[#8b5e12] sm:inline-flex">Secure login</span>
      </div>

      {/* Auth method toggle */}
      <div className="mt-5 flex rounded-xl bg-[#e8ede9] p-1 gap-1">
        {(['email', 'phone'] as const).map((method) => {
          const Icon = method === 'email' ? Mail : Phone;
          const active = authMethod === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => setAuthMethod(method)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg h-9 text-sm font-semibold transition-all duration-200 ${
                active ? 'bg-[#2d6b4e] text-white shadow-sm' : 'text-[#6b7c72] hover:text-[#2e5440]'
              }`}
            >
              <Icon className="size-3.5" />
              {method === 'email' ? 'Email' : 'Phone'}
            </button>
          );
        })}
      </div>

      <div className="min-h-[196px]">

      {/* Email form */}
      {authMethod === 'email' && (
        <form method="post" onSubmit={handleEmailLogin} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className={labelClass}>Email address</Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onAnimationStart={(e) => {
                if (e.animationName === 'autofill-start') setEmail(emailRef.current?.value ?? '');
              }}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className={labelClass}>Password</Label>
              <Link href="/forgot-password" className="text-xs font-bold text-[#2d6b4e] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onAnimationStart={(e) => {
                  if (e.animationName === 'autofill-start') setPassword(passwordRef.current?.value ?? '');
                }}
                required
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-[#8fa89a] hover:bg-[#e6eceb] hover:text-[#2d6b4e] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className={primaryButtonClass}>
            {isLoading ? <><Loader2 className="size-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="size-4" /></>}
          </Button>
        </form>
      )}

      {/* Phone form */}
      {authMethod === 'phone' && (
        <form method="post" onSubmit={handlePhoneLogin} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className={labelClass}>Phone number</Label>
            <div className="flex gap-2">
              <span className="flex h-10 shrink-0 items-center rounded-xl border-2 border-[#dce6df] bg-[#f0f5f1] px-3.5 text-sm font-bold text-[#496159]">+92</span>
              <Input
                id="phone"
                type="tel"
                placeholder="300 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>
          {otpSent && (
            <div className="space-y-1.5">
              <Label htmlFor="otp" className={labelClass}>One-time code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className={inputClass}
              />
              <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-[#2d6b4e] hover:underline">
                Resend code
              </button>
            </div>
          )}
          <Button
            type={otpSent ? 'submit' : 'button'}
            onClick={otpSent ? undefined : handleSendOtp}
            disabled={isLoading}
            className={primaryButtonClass}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : otpSent ? <>Verify and sign in <ArrowRight className="size-4" /></> : 'Send one-time code'}
          </Button>
        </form>
      )}

      </div>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#87938b]">
        <div className="h-px flex-1 bg-[#d1ddd6]" /> or continue with <div className="h-px flex-1 bg-[#d1ddd6]" />
      </div>

      {/* Google role selector */}
      <div className="grid grid-cols-2 gap-2">
        {(['creator', 'brand'] as UserRole[]).map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setGoogleRole(role)}
            className={`h-9 rounded-full border-2 text-xs font-bold capitalize transition-colors ${
              googleRole === role
                ? 'border-[#2d6b4e] bg-[#e6eceb] text-[#2d6b4e]'
                : 'border-[#cddad1] text-[#6b7870] hover:border-[#2d6b4e] hover:text-[#2d6b4e]'
            }`}
          >
            {role}
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="mt-2 h-10 w-full rounded-full border-2 border-[#cddad1] bg-white text-sm font-bold text-[#2f5243] hover:border-[#2d6b4e] hover:bg-[#f4f8f4] transition-colors"
      >
        Continue with Google
      </Button>

      <p className="mt-4 text-center text-sm text-[#6b7870]">
        New to ZingZing?{' '}
        <Link href="/signup" className="font-extrabold text-[#2d6b4e] hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
