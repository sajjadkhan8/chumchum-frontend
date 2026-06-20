'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Check, Circle, Eye, EyeOff, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isPasswordStrong, PASSWORD_REQUIREMENTS_MESSAGE, validatePassword, type PasswordStrengthResult } from '@/lib/password-validation';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';

const inputClass = 'h-11 rounded-xl border-[#cddad1] bg-[#fbfaf5] px-3.5 text-[#1e3d2e] shadow-none focus-visible:border-[#2d6b4e] focus-visible:ring-[#2d6b4e]/15';
const primaryButtonClass = 'h-11 w-full rounded-full bg-[#2d6b4e] font-bold text-white hover:bg-[#1f5239] disabled:opacity-50 disabled:cursor-not-allowed';

const roleOptions: { value: UserRole; label: string; eyebrow: string; icon: React.ElementType; description: string; benefits: string[] }[] = [
  {
    value: 'creator',
    label: 'Creator',
    eyebrow: 'Build your profile',
    icon: Users,
    description: 'Find fitting opportunities and turn your point of view into better work.',
    benefits: ['Package your services', 'Meet verified brands', 'Track every collaboration'],
  },
  {
    value: 'brand',
    label: 'Brand',
    eyebrow: 'Grow your reach',
    icon: Building2,
    description: 'Discover trusted local creators and run campaigns in one calm place.',
    benefits: ['Search verified creators', 'Send clear campaigns', 'Manage campaign delivery'],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { signup, signupWithGoogle, isLoading, user, isAuthenticated, hasHydrated } = useAuthStore();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthResult | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | undefined>();
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role) {
      router.replace(user.role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
      return;
    }
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    const requestedAffiliate = new URLSearchParams(window.location.search).get('affiliate')?.trim();
    if (requestedAffiliate) {
      setAffiliateCode(requestedAffiliate);
    }
    if (!role && (requestedRole === 'creator' || requestedRole === 'brand')) {
      setRole(requestedRole);
      setStep('details');
    }
  }, [hasHydrated, isAuthenticated, user, router, role]);

  if (hasHydrated && isAuthenticated && user?.role) {
    return <div className="grid min-h-screen place-items-center bg-[#fbfaf5]"><Loader2 className="size-6 animate-spin text-[#2d6b4e]" /></div>;
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(validatePassword(value));
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    if (!termsAccepted) {
      toast.error('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!isPasswordStrong(password)) {
      toast.error(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }
    try {
      await signup(email, password, role, name, affiliateCode, true);
      toast.success('Account created successfully!');
      router.push(role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    if (!role) return;
    if (!termsAccepted) {
      toast.error('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }
    try {
      await signupWithGoogle(role, name, affiliateCode, true);
      toast.success('Account created successfully!');
      router.push(role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google signup failed. Please try again.');
    }
  };

  const requirements = passwordStrength ? [
    ['8+ characters', passwordStrength.requirements.minLength],
    ['Lowercase', passwordStrength.requirements.hasLowercase],
    ['Uppercase', passwordStrength.requirements.hasUppercase],
    ['Number', passwordStrength.requirements.hasNumber],
    ['Special character', passwordStrength.requirements.hasSpecialChar],
  ] : [];

  return (
    <AuthShell
      eyebrow="Join the network"
      title="Make local influence feel effortless."
      description="A focused place for creators and brands to discover each other, agree on the work, and build lasting partnerships."
      hideMobileHeader
    >
      {step === 'role' ? (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Get started</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">Choose your path.</h2>
          <p className="mt-2 text-sm leading-6 text-[#6b7870]">We'll shape your workspace around what you want to do.</p>

          <div className="mt-6 grid gap-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setRole(option.value); setStep('details'); }}
                  className="group rounded-2xl border border-[#d1ddd6] bg-[#fbfaf5] p-4 text-left transition hover:border-[#2d6b4e] hover:bg-[#f4f6f1]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#2d6b4e] text-white"><Icon className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">{option.eyebrow}</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-extrabold tracking-[-0.025em] text-[#1e3d2e]">{option.label}</h3>
                        <ArrowRight className="size-4 text-[#718077] transition group-hover:translate-x-1 group-hover:text-[#2d6b4e]" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#6b7870]">{option.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {option.benefits.map((benefit) => <span key={benefit} className="rounded-full border border-[#d1ddd6] bg-white px-2 py-1 text-[10px] font-bold text-[#526259]">{benefit}</span>)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-[#6b7870]">Already have an account? <Link href="/login" className="font-extrabold text-[#2d6b4e] hover:underline">Sign in</Link></p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
          <button type="button" onClick={() => setStep('role')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#6b7870] hover:text-[#2d6b4e]">
            <ArrowLeft className="size-3.5" /> Change account type
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">{role === 'creator' ? 'Creator account' : 'Brand account'}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#1e3d2e]">Create your account.</h2>
              <p className="mt-2 text-sm leading-6 text-[#6b7870]">A few details and you're ready to connect.</p>
            </div>
            <span className="mt-1 hidden rounded-full bg-[#f7e8c8] px-3 py-2 text-[11px] font-bold capitalize text-[#8b5e12] sm:inline-flex">{role}</span>
          </div>
          {affiliateCode && (
            <div className="mt-4 rounded-xl border border-[#d1ddd6] bg-[#e6eceb] px-3 py-2.5 text-[11px] font-bold text-[#496159]">
              Affiliate code applied: <span className="text-[#2d6b4e]">{affiliateCode}</span>
            </div>
          )}

          {/* HIGH-13: ToS consent — required before both Google and email signup */}
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d1ddd6] bg-[#f4f2e9] px-3.5 py-3 transition hover:border-[#2d6b4e]">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="peer sr-only"
                id="termsAccepted"
              />
              <div className="grid size-4.5 place-items-center rounded border-2 border-[#cddad1] bg-white transition peer-checked:border-[#2d6b4e] peer-checked:bg-[#2d6b4e] peer-focus-visible:ring-2 peer-focus-visible:ring-[#2d6b4e]/30">
                {termsAccepted && <Check className="size-3 text-white" strokeWidth={3} />}
              </div>
            </div>
            <span className="text-[11px] leading-5 text-[#526259]">
              I agree to the{' '}
              <Link href="/terms" className="font-bold text-[#2d6b4e] hover:underline" onClick={(e) => e.stopPropagation()}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-bold text-[#2d6b4e] hover:underline" onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>
              , and consent to the collection and processing of my personal data as described therein.
            </span>
          </label>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignup}
              disabled={isLoading || !role || !termsAccepted}
              className="h-11 w-full rounded-full border-[#ccd7ce] bg-white font-bold text-[#2f5243] hover:border-[#2d6b4e] hover:bg-[#fbfaf5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Google
            </Button>
            {!termsAccepted && (
              <p className="mt-1.5 text-center text-[10px] text-[#87938b]">Accept the terms above to continue with Google</p>
            )}
          </div>
          <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#87938b]">
            <div className="h-px flex-1 bg-[#d1ddd6]" /> or use email <div className="h-px flex-1 bg-[#d1ddd6]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-[#496159]">{role === 'creator' ? 'Full name' : 'Brand or company name'}</Label>
              <Input id="name" type="text" placeholder={role === 'creator' ? 'Ali Hassan Khan' : 'Your brand name'} value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#496159]">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="affiliateCode" className="text-xs font-bold text-[#496159]">Referral code <span className="font-semibold text-[#87938b]">(optional)</span></Label>
              <Input
                id="affiliateCode"
                type="text"
                placeholder="Enter a referral code"
                value={affiliateCode || ''}
                onChange={(event) => setAffiliateCode(event.target.value.trim() || undefined)}
                className={`${inputClass} uppercase`}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-[#496159]">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(event) => handlePasswordChange(event.target.value)} required className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#718077] hover:bg-[#e6eceb] hover:text-[#2d6b4e]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {password && passwordStrength && (
                <div className="rounded-xl border border-[#d1ddd6] bg-[#f4f2e9] p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#526259]">Password strength</span>
                    <span className="capitalize text-[#2d6b4e]">{passwordStrength.strength}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index < Math.ceil(passwordStrength.score / 20) ? 'bg-[#2d6b4e]' : 'bg-[#cddad1]'}`} />)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                    {requirements.map(([label, met]) => (
                      <span key={String(label)} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${met ? 'text-[#2d6b4e]' : 'text-[#87938b]'}`}>
                        {met ? <Check className="size-3" /> : <Circle className="size-2.5" />} {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Button type="submit" disabled={isLoading || !termsAccepted} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="size-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[#6b7870]">Already have an account? <Link href="/login" className="font-extrabold text-[#2d6b4e] hover:underline">Sign in</Link></p>
        </motion.div>
      )}
    </AuthShell>
  );
}
