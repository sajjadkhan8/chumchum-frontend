'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';

const getDashboardPath = (role?: string) => {
  if (role === 'platform_admin') return '/admin/dashboard';
  return role === 'creator' ? '/creator/dashboard' : '/brand/dashboard';
};

const getPostLoginPath = (role?: string) => {
  if (typeof window === 'undefined') return getDashboardPath(role);
  const nextPath = new URLSearchParams(window.location.search).get('next');
  return nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : getDashboardPath(role);
};

const inputClass = 'h-11 rounded-xl border-[#d6ded7] bg-[#fbfaf5] px-3.5 text-[#173b2a] shadow-none focus-visible:border-[#185c39] focus-visible:ring-[#185c39]/15';
const primaryButtonClass = 'h-11 w-full rounded-full bg-[#185c39] font-bold text-white hover:bg-[#104b2d]';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loginWithPhone, requestOtp, isLoading, user, isAuthenticated, hasHydrated } = useAuthStore();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [googleRole, setGoogleRole] = useState<UserRole>('creator');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [activeDemoEmail, setActiveDemoEmail] = useState('');

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role) router.replace(getPostLoginPath(user.role));
  }, [hasHydrated, isAuthenticated, user, router]);

  if (hasHydrated && isAuthenticated && user?.role) {
    return <div className="grid min-h-screen place-items-center bg-[#fbfaf5]"><Loader2 className="size-6 animate-spin text-[#185c39]" /></div>;
  }

  const applyDemoCredentials = (demoEmail: string) => {
    setAuthMethod('email');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setEmail(demoEmail);
    setPassword('password');
    setActiveDemoEmail(demoEmail);
    toast.success('Demo credentials applied');
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid credentials');
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
    try {
      await loginWithPhone(phone, otp);
      toast.success('Welcome back!');
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid OTP');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(googleRole);
      toast.success('Welcome back!');
      router.push(getPostLoginPath(useAuthStore.getState().user?.role));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google login failed');
    }
  };

  const demos = [
    ['Creator', 'ali.rehmani@zingzing.pk'],
    ['Ambassador', 'ambassador@test.com'],
    ['Brand', 'influencer@foodpanda.pk'],
    ['Admin', 'ops@zingzing.pk'],
  ];

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Good work starts with the right connection."
      description="Pick up conversations, opportunities, and collaborations without losing the thread."
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Sign in</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#173b2a]">Welcome back.</h2>
          <p className="mt-2 text-sm leading-6 text-[#69766e]">Continue to your ZingZing workspace.</p>
        </div>
        <span className="mt-1 hidden rounded-full bg-[#f7e8c8] px-3 py-2 text-[11px] font-bold text-[#8b5e12] sm:inline-flex">Secure login</span>
      </div>

      <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as 'email' | 'phone')} className="mt-6">
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-[#eef2eb] p-1">
          <TabsTrigger value="email" className="rounded-full font-bold data-[state=active]:bg-white data-[state=active]:text-[#185c39]"><Mail className="size-4" /> Email</TabsTrigger>
          <TabsTrigger value="phone" className="rounded-full font-bold data-[state=active]:bg-white data-[state=active]:text-[#185c39]"><Phone className="size-4" /> Phone</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-5">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#3d5d49]">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold text-[#3d5d49]">Password</Label>
                <Link href="/forgot-password" className="text-xs font-bold text-[#185c39] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#718077] hover:bg-[#eef2eb] hover:text-[#185c39]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="size-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="size-4" /></>}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="phone" className="mt-5">
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-[#3d5d49]">Phone number</Label>
              <div className="flex gap-2">
                <span className="flex h-11 items-center rounded-xl border border-[#d6ded7] bg-[#eef2eb] px-3 text-sm font-bold text-[#3d5d49]">+92</span>
                <Input id="phone" type="tel" placeholder="300 1234567" value={phone} onChange={(event) => setPhone(event.target.value)} required className={inputClass} />
              </div>
            </div>
            {otpSent && (
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-xs font-bold text-[#3d5d49]">One-time code</Label>
                <Input id="otp" inputMode="numeric" placeholder="Enter 6-digit code" value={otp} onChange={(event) => setOtp(event.target.value)} maxLength={6} required className={inputClass} />
                <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-[#185c39] hover:underline">Resend code</button>
              </div>
            )}
            <Button type={otpSent ? 'submit' : 'button'} onClick={otpSent ? undefined : handleSendOtp} disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : otpSent ? <>Verify and sign in <ArrowRight className="size-4" /></> : 'Send one-time code'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#87938b]">
        <div className="h-px flex-1 bg-[#dce3dc]" /> or continue with <div className="h-px flex-1 bg-[#dce3dc]" />
      </div>
      <div className="grid grid-cols-[1fr_1fr] gap-2">
        {(['creator', 'brand'] as UserRole[]).map((role) => (
          <button key={role} type="button" onClick={() => setGoogleRole(role)} className={`h-10 rounded-full border text-xs font-bold capitalize transition ${googleRole === role ? 'border-[#185c39] bg-[#eef2eb] text-[#185c39]' : 'border-[#d6ded7] text-[#69766e] hover:border-[#185c39]'}`}>
            {role}
          </button>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="mt-2 h-11 w-full rounded-full border-[#ccd7ce] bg-white font-bold text-[#294b38] hover:border-[#185c39] hover:bg-[#fbfaf5]">
        Continue with Google
      </Button>

      <div className="mt-5 rounded-2xl border border-[#dce3dc] bg-[#f4f2e9] p-3">
        <button type="button" onClick={() => setShowDemoAccounts(!showDemoAccounts)} className="flex w-full items-center justify-between gap-3 text-left text-xs font-bold text-[#3d5d49]" aria-expanded={showDemoAccounts}>
          Explore with a demo account
          {showDemoAccounts ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <AnimatePresence>
          {showDemoAccounts && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {demos.map(([label, demoEmail]) => (
                  <button key={demoEmail} type="button" onClick={() => applyDemoCredentials(demoEmail)} className={`rounded-xl border p-2.5 text-left transition ${activeDemoEmail === demoEmail ? 'border-[#185c39] bg-white' : 'border-[#dce3dc] bg-white/70 hover:border-[#b8c8bb]'}`}>
                    <span className="block text-[11px] font-extrabold text-[#173b2a]">{label}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[#718077]">{demoEmail}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-5 text-center text-sm text-[#69766e]">New to ZingZing? <Link href="/signup" className="font-extrabold text-[#185c39] hover:underline">Create an account</Link></p>
    </AuthShell>
  );
}
