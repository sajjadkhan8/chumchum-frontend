'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, Users, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import type { UserRole } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';

export default function SignupPage() {
  const router = useRouter();
  const { signup, isLoading } = useAuthStore();
  
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const roleOptions: { value: UserRole; label: string; icon: React.ElementType; description: string; benefits: string[] }[] = [
    {
      value: 'creator',
      label: 'I am a Creator',
      icon: Users,
      description: 'Showcase your work, get brand deals, and earn money',
      benefits: ['Create packages for brands', 'Accept paid & barter deals', 'Track your earnings'],
    },
    {
      value: 'brand',
      label: 'I am a Brand',
      icon: Building2,
      description: 'Find creators and run influencer marketing campaigns',
      benefits: ['Discover verified creators', 'Send quick deal offers', 'Manage all campaigns'],
    },
  ];

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    try {
      await signup(email, password, role, name);
      toast.success('Account created successfully!');
      
      if (role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/brand/dashboard');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden bg-gradient-to-br from-primary via-primary to-primary/80 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div>
          <Link href="/" className="inline-flex items-center">
            <ZingZingLogo variant="dark" className="h-11 w-[230px]" />
          </Link>
        </div>
        
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight text-white xl:text-5xl"
          >
            Join Saudi Arabia&apos;s
            <br />
            Largest Creator
            <br />
            Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-lg text-white/80"
          >
            Whether you&apos;re a creator looking for brand deals or a brand searching for influencers, ZingZing connects you with the right partners.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          {[
            { value: '10K+', label: 'Creators' },
            { value: '5K+', label: 'Brands' },
            { value: '50K+', label: 'Deals' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-white/70">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="mb-8 inline-flex items-center lg:hidden">
            <ZingZingLogo variant="light" className="h-10 w-[210px]" />
          </Link>

          {step === 'role' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
              <p className="mt-2 text-muted-foreground">
                Choose how you want to use ZingZing
              </p>

              <div className="mt-8 space-y-4">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleRoleSelect(option.value)}
                      className="w-full rounded-2xl border-2 border-border p-6 text-left transition-all hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{option.label}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {option.description}
                          </p>
                          <ul className="mt-3 space-y-1">
                            {option.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setStep('role')}
                className="mb-6 text-sm text-muted-foreground hover:text-foreground"
              >
                &larr; Back to role selection
              </button>

              <h2 className="text-2xl font-bold text-foreground">
                {role === 'creator' ? 'Create your creator profile' : 'Set up your brand account'}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Fill in your details to get started
              </p>

              <form onSubmit={handleSignup} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {role === 'creator' ? 'Full Name' : 'Brand/Company Name'}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={role === 'creator' ? 'Faisal Al Harbi' : 'Noon Food KSA'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    By creating an account, you agree to our{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 rounded-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
