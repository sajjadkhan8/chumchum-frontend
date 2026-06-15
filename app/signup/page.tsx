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
import { validatePassword, type PasswordStrengthResult } from '@/lib/password-validation';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';

const inputClass = 'h-11 rounded-xl border-[#d6ded7] bg-[#fbfaf5] px-3.5 text-[#173b2a] shadow-none focus-visible:border-[#185c39] focus-visible:ring-[#185c39]/15';
const primaryButtonClass = 'h-11 w-full rounded-full bg-[#185c39] font-bold text-white hover:bg-[#104b2d]';

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
    benefits: ['Search verified creators', 'Send clear offers', 'Manage campaign delivery'],
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

  useEffect(() => {
    if (hasHydrated && isAuthenticated && user?.role) {
      router.replace(user.role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
      return;
    }
    const requestedRole = new URLSearchParams(window.location.search).get('role');
    if (!role && (requestedRole === 'creator' || requestedRole === 'brand')) {
      setRole(requestedRole);
      setStep('details');
    }
  }, [hasHydrated, isAuthenticated, user, router, role]);

  if (hasHydrated && isAuthenticated && user?.role) {
    return <div className="grid min-h-screen place-items-center bg-[#fbfaf5]"><Loader2 className="size-6 animate-spin text-[#185c39]" /></div>;
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(validatePassword(value));
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    try {
      await signup(email, password, role, name);
      toast.success('Account created successfully!');
      router.push(role === 'creator' ? '/creator/dashboard' : '/brand/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleSignup = async () => {
    if (!role) return;
    try {
      await signupWithGoogle(role, name);
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
    >
      {step === 'role' ? (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">Get started</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#173b2a]">Choose your path.</h2>
          <p className="mt-2 text-sm leading-6 text-[#69766e]">We’ll shape your workspace around what you want to do.</p>

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
                  className="group rounded-2xl border border-[#dce3dc] bg-[#fbfaf5] p-4 text-left transition hover:border-[#185c39] hover:bg-[#f4f6f1]"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#185c39] text-white"><Icon className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">{option.eyebrow}</p>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <h3 className="text-lg font-extrabold tracking-[-0.025em] text-[#173b2a]">{option.label}</h3>
                        <ArrowRight className="size-4 text-[#718077] transition group-hover:translate-x-1 group-hover:text-[#185c39]" />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-[#69766e]">{option.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {option.benefits.map((benefit) => <span key={benefit} className="rounded-full border border-[#dce3dc] bg-white px-2 py-1 text-[10px] font-bold text-[#526259]">{benefit}</span>)}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-6 text-center text-sm text-[#69766e]">Already have an account? <Link href="/login" className="font-extrabold text-[#185c39] hover:underline">Sign in</Link></p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
          <button type="button" onClick={() => setStep('role')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#69766e] hover:text-[#185c39]">
            <ArrowLeft className="size-3.5" /> Change account type
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b77a12]">{role === 'creator' ? 'Creator account' : 'Brand account'}</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#173b2a]">Create your account.</h2>
              <p className="mt-2 text-sm leading-6 text-[#69766e]">A few details and you’re ready to connect.</p>
            </div>
            <span className="mt-1 hidden rounded-full bg-[#f7e8c8] px-3 py-2 text-[11px] font-bold capitalize text-[#8b5e12] sm:inline-flex">{role}</span>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleSignup} disabled={isLoading || !role} className="mt-5 h-11 w-full rounded-full border-[#ccd7ce] bg-white font-bold text-[#294b38] hover:border-[#185c39] hover:bg-[#fbfaf5]">
            Continue with Google
          </Button>
          <div className="my-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#87938b]">
            <div className="h-px flex-1 bg-[#dce3dc]" /> or use email <div className="h-px flex-1 bg-[#dce3dc]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold text-[#3d5d49]">{role === 'creator' ? 'Full name' : 'Brand or company name'}</Label>
              <Input id="name" type="text" placeholder={role === 'creator' ? 'Ali Hassan Khan' : 'Your brand name'} value={name} onChange={(event) => setName(event.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#3d5d49]">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-[#3d5d49]">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(event) => handlePasswordChange(event.target.value)} required className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#718077] hover:bg-[#eef2eb] hover:text-[#185c39]" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {password && passwordStrength && (
                <div className="rounded-xl border border-[#dce3dc] bg-[#f4f2e9] p-3">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#526259]">Password strength</span>
                    <span className="capitalize text-[#185c39]">{passwordStrength.strength}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index < Math.ceil(passwordStrength.score / 20) ? 'bg-[#185c39]' : 'bg-[#d6ded7]'}`} />)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                    {requirements.map(([label, met]) => (
                      <span key={String(label)} className={`inline-flex items-center gap-1 text-[10px] font-semibold ${met ? 'text-[#185c39]' : 'text-[#87938b]'}`}>
                        {met ? <Check className="size-3" /> : <Circle className="size-2.5" />} {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="rounded-xl bg-[#eef2eb] px-3 py-2.5 text-[11px] leading-5 text-[#69766e]">
              By creating an account, you agree to our <Link href="/terms" className="font-bold text-[#185c39] hover:underline">Terms</Link> and <Link href="/privacy" className="font-bold text-[#185c39] hover:underline">Privacy Policy</Link>.
            </p>
            <Button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? <><Loader2 className="size-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="size-4" /></>}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[#69766e]">Already have an account? <Link href="/login" className="font-extrabold text-[#185c39] hover:underline">Sign in</Link></p>
        </motion.div>
      )}
    </AuthShell>
  );
}
