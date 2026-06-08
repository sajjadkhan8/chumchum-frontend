'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Phone, Eye, EyeOff, Loader2, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';
import type { UserRole } from '@/types';

const getDashboardPath = (role?: string) => {
  if (role === 'platform_admin') return '/admin/dashboard';
  return role === 'creator' ? '/creator/dashboard' : '/brand/dashboard';
};

const getPostLoginPath = (role?: string) => {
  if (typeof window === 'undefined') return getDashboardPath(role);

  const nextPath = new URLSearchParams(window.location.search).get('next');
  return nextPath?.startsWith('/') && !nextPath.startsWith('//')
    ? nextPath
    : getDashboardPath(role);
};

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

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user?.role) return;
    router.replace(getPostLoginPath(user.role));
  }, [hasHydrated, isAuthenticated, user, router]);

  if (hasHydrated && isAuthenticated && user?.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const applyDemoCredentials = (demoEmail: string) => {
    // Always route demo users to the email form and clear phone-login leftovers.
    setAuthMethod('email');
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setEmail(demoEmail);
    setPassword('password');
    setActiveDemoEmail(demoEmail);
    toast.success('Demo credentials applied');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      
      // Redirect based on role
      const user = useAuthStore.getState().user;
      router.push(getPostLoginPath(user?.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials';
      toast.error(message);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      await requestOtp(phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast.error(message);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPhone(phone, otp);
      toast.success('Welcome back!');
      
      const user = useAuthStore.getState().user;
      router.push(getPostLoginPath(user?.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      toast.error(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle(googleRole);
      toast.success('Welcome back!');
      const nextUser = useAuthStore.getState().user;
      router.push(getPostLoginPath(nextUser?.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google login failed';
      toast.error(message);
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
            Pakistan&apos;s
            <br />
            Influencer
            <br />
            Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-lg text-white/80"
          >
            Connect with top creators across Pakistan. Paid deals, barter collaborations, and everything in between.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 border-primary bg-white"
                  style={{
                    backgroundImage: `url(https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i})`,
                    backgroundSize: 'cover',
                  }}
                />
              ))}
            </div>
            <p className="text-sm text-white/80">
              <span className="font-semibold text-white">10,000+</span> creators across Pakistan
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="mb-8 inline-flex items-center lg:hidden">
            <ZingZingLogo variant="light" className="h-10 w-[210px]" />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your account to continue
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as 'email' | 'phone')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="mt-6">
                <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
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

                  <Button
                    type="submit"
                    className="w-full gap-2 rounded-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="phone" className="mt-6">
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                        +92
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="300 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1"
                        required
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full rounded-full"
                      size="lg"
                    >
                      Send OTP
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input
                          id="otp"
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-sm text-primary hover:underline"
                        >
                          Resend OTP
                        </button>
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
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify & Sign in
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>

            <div className="mt-6">
              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>or continue with</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="mb-3 space-y-2">
                <p className="text-xs text-muted-foreground">Continue with Google as:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={googleRole === 'creator' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setGoogleRole('creator')}
                    disabled={isLoading}
                  >
                    Creator
                  </Button>
                  <Button
                    type="button"
                    variant={googleRole === 'brand' ? 'default' : 'outline'}
                    className="rounded-full"
                    onClick={() => setGoogleRole('brand')}
                    disabled={isLoading}
                  >
                    Brand
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="mr-2 h-4 w-4">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.8 2.2-1.7 2.9l2.8 2.2c1.7-1.5 2.6-3.8 2.6-6.5 0-.6-.1-1.2-.2-1.8H12z"/>
                  <path fill="#34A853" d="M12 21c2.4 0 4.4-.8 5.8-2.1l-2.8-2.2c-.8.5-1.8.8-3 .8-2.3 0-4.2-1.5-4.8-3.6l-2.9 2.2C5.7 18.9 8.6 21 12 21z"/>
                  <path fill="#4A90E2" d="M7.2 13.9c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7l-2.9-2.2C3.8 9.2 3.5 10.2 3.5 11.2s.3 2 .8 2.9l2.9-2.2z"/>
                  <path fill="#FBBC05" d="M12 6.9c1.3 0 2.4.4 3.3 1.3l2.5-2.5C16.4 4.4 14.4 3.5 12 3.5 8.6 3.5 5.7 5.6 4.3 8.3l2.9 2.2c.6-2.1 2.5-3.6 4.8-3.6z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </motion.div>

          {/* Demo accounts info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-xl border border-border bg-muted/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Demo Accounts</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setShowDemoAccounts((current) => !current)}
                aria-expanded={showDemoAccounts}
              >
                {showDemoAccounts ? 'Hide' : 'Show'}
                {showDemoAccounts ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
              </Button>
            </div>
            {showDemoAccounts && (
              <>
                <div className="mt-2 space-y-2">
                  <div className={`flex items-center justify-between rounded-lg border p-2.5 ${activeDemoEmail === 'ali.rehmani@chumchum.pk' ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background'}`}>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        Creator (On Ambassador Path)
                        {activeDemoEmail === 'ali.rehmani@chumchum.pk' && <span className="ml-2 text-primary">Active</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">ali.rehmani@chumchum.pk</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => applyDemoCredentials('ali.rehmani@chumchum.pk')}>
                      Use
                    </Button>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg border p-2.5 ${activeDemoEmail === 'ambassador@test.com' ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background'}`}>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        Ambassador
                        {activeDemoEmail === 'ambassador@test.com' && <span className="ml-2 text-primary">Active</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">ambassador@test.com</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => applyDemoCredentials('ambassador@test.com')}>
                      Use
                    </Button>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg border p-2.5 ${activeDemoEmail === 'influencer@foodpanda.pk' ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background'}`}>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        Brand
                        {activeDemoEmail === 'influencer@foodpanda.pk' && <span className="ml-2 text-primary">Active</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">influencer@foodpanda.pk</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => applyDemoCredentials('influencer@foodpanda.pk')}>
                      Use
                    </Button>
                  </div>
                  <div className={`flex items-center justify-between rounded-lg border p-2.5 ${activeDemoEmail === 'ops@chumchum.pk' ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-background'}`}>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-foreground">
                        Admin
                        {activeDemoEmail === 'ops@chumchum.pk' && <span className="ml-2 text-primary">Active</span>}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">ops@chumchum.pk</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => applyDemoCredentials('ops@chumchum.pk')}>
                      Use
                    </Button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Password: <span className="font-mono">password</span>
                </p>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
