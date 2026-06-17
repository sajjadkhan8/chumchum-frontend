'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { ZingZingLogo } from '@/src/components/ZingZingLogo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { brandsService } from '@/services/brands.service';

type PlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

const plans: {
  id: PlanTier;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 'PKR 0',
    description: 'Perfect for first-time collaborations in Pakistan.',
    features: ['Browse creators', 'Send 5 campaigns/month', 'Basic campaign tracking'],
  },
  {
    id: 'GROWTH',
    name: 'Growth',
    price: 'PKR 487,500/mo',
    description: 'For scaling brands running multiple influencer campaigns.',
    features: ['Unlimited campaigns', 'Priority chat support', 'Performance insights'],
    highlighted: true,
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams managing regional creator programs.',
    features: ['Dedicated manager', 'Team permissions', 'Verification workflow'],
  },
];

export default function PricingPage() {
  const { user, hasHydrated } = useAuthStore();
  const isBrand = hasHydrated && user?.role === 'brand';

  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [selecting, setSelecting] = useState<PlanTier | null>(null);
  const [successPlan, setSuccessPlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    if (!isBrand) return;
    brandsService.getMe().then((brand) => {
      if (brand?.planTier) setCurrentPlan(brand.planTier as PlanTier);
    }).catch(() => undefined);
  }, [isBrand]);

  const handleSelect = async (planId: PlanTier) => {
    if (planId === currentPlan || selecting) return;
    setSelecting(planId);
    try {
      await brandsService.selectPlan(planId);
      setCurrentPlan(planId);
      setSuccessPlan(planId);
      setTimeout(() => setSuccessPlan(null), 3000);
    } catch {
      // leave current plan unchanged on error
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mb-10 text-center">
          <Link href="/" aria-label="ZingZing home" className="mb-4 inline-flex items-center justify-center">
            <ZingZingLogo variant="light" className="h-9 w-[180px]" aria-hidden="true" />
          </Link>
          <h1 className="text-3xl font-bold md:text-4xl">Pricing</h1>
          <p className="mt-2 text-muted-foreground">
            Simple plans designed for Pakistan-first influencer campaigns.
          </p>
          {isBrand && currentPlan && (
            <p className="mt-3 text-sm text-muted-foreground">
              Your current plan: <span className="font-semibold capitalize text-primary">{currentPlan.toLowerCase()}</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isActive = currentPlan === plan.id;
            const isLoading = selecting === plan.id;
            const isSuccess = successPlan === plan.id;

            return (
              <Card
                key={plan.name}
                className={cn(
                  'border-border/60 transition-shadow',
                  plan.highlighted && 'ring-2 ring-primary shadow-lg',
                  isActive && 'border-primary bg-primary/5',
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    {isActive && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {isBrand && (
                    <Button
                      className="w-full"
                      variant={isActive ? 'outline' : plan.highlighted ? 'default' : 'outline'}
                      disabled={isActive || !!selecting}
                      onClick={() => handleSelect(plan.id)}
                    >
                      {isLoading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Switching…</>
                      ) : isSuccess ? (
                        <><CheckCircle2 className="mr-2 h-4 w-4" />Switched!</>
                      ) : isActive ? (
                        'Current Plan'
                      ) : (
                        `Select ${plan.name}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isBrand && (
          <div className="mt-10 text-center">
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
