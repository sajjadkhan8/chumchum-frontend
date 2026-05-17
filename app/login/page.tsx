'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Phone, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/brand-logo';
import { BRAND } from '@/lib/brand';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPhone, isLoading } = useAuthStore();
  
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      
      // Redirect based on role
      const user = useAuthStore.getState().user;
      if (user?.role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/brand/dashboard');
      }
    } catch {
      toast.error('Invalid credentials');
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast.error('Please enter your phone number');
      return;
    }
    // Simulate OTP send
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setOtpSent(true);
    toast.success('OTP sent to your phone');
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPhone(phone, otp);
      toast.success('Welcome back!');
      
      const user = useAuthStore.getState().user;
      if (user?.role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/brand/dashboard');
      }
    } catch {
      toast.error('Invalid OTP');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div
        className="hidden bg-brand-panel lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
        style={{
          backgroundImage: `linear-gradient(140deg, rgba(5,8,42,.8), rgba(5,8,42,.9)), url(${BRAND.assets.bannerDark})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div>
          <BrandLogo textClassName="text-white" />
        </div>
        
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold leading-tight text-white xl:text-5xl"
          >
            Saudi Arabia's
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
            Connect with top creators across Saudi Arabia. Paid deals, barter collaborations, and everything in between.
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
              <span className="font-semibold text-white">10,000+</span> creators across Saudi Arabia
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <BrandLogo className="mb-8 lg:hidden" />

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
                        +966
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="5X XXX XXXX"
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
          </motion.div>

          {/* Demo accounts info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 rounded-xl border border-border bg-muted/50 p-4"
          >
            <p className="text-xs font-medium text-muted-foreground">Demo Accounts:</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Creator: <span className="font-mono">creator@test.com</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Brand: <span className="font-mono">brand@test.com</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Password: <span className="font-mono">any password</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
