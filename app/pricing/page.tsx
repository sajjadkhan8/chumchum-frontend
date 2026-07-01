'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BadgeCheck,
  CheckCircle2,
  Crown,
  Loader2,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { brandsService } from '@/services/brands.service';

type BackendPlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
type PricingPlanId = 'STARTER' | 'GROWTH' | 'PRO' | 'CUSTOM';

interface PricingPlan {
  id: PricingPlanId;
  backendTier?: BackendPlanTier;
  name: string;
  eyebrow: string;
  price: string;
  cadence: string;
  description: string;
  capacity: string;
  features: string[];
  highlighted?: boolean;
  contactOnly?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'STARTER',
    backendTier: 'STARTER',
    name: 'Starter',
    eyebrow: 'Free launch',
    price: 'PKR 0',
    cadence: 'forever',
    description: 'For a small brand testing creator collaborations before committing regular spend.',
    capacity: '5 campaign creations / month',
    features: [
      'Creator search and public profiles',
      'Saved creators and brand preferences',
      'Campaign templates, briefs, and deliverables',
      'Package orders with wallet top-up',
      'Messages, notifications, and basic order tracking',
    ],
  },
  {
    id: 'GROWTH',
    backendTier: 'GROWTH',
    name: 'Growth',
    eyebrow: 'Regular campaigns',
    price: 'PKR 5,000',
    cadence: 'per month',
    description: 'For restaurants, cafes, salons, and local brands running creator work every month.',
    capacity: '50 campaign creations / month',
    features: [
      'Everything in Starter',
      '50 monthly campaign launches',
      'Creator reactions, proposals, and shortlisting',
      'Brand analytics from orders, spend, reviews, and creator activity',
      'Payments hub with wallet balance, invoices, and disbursements',
    ],
    highlighted: true,
  },
  {
    id: 'PRO',
    backendTier: 'ENTERPRISE',
    name: 'Pro',
    eyebrow: 'High volume',
    price: 'PKR 15,000',
    cadence: 'per month',
    description: 'For teams managing always-on creator pipelines across multiple launches or branches.',
    capacity: 'Unlimited campaign creations',
    features: [
      'Everything in Growth',
      'Unlimited monthly campaign launches',
      'Brand verification document workflow',
      'Disputes, reviews, and order approval controls',
      'Affiliate and ambassador program access',
    ],
  },
  {
    id: 'CUSTOM',
    name: 'Enterprise / Custom',
    eyebrow: 'Managed programs',
    price: 'Contact us',
    cadence: 'custom scope',
    description: 'For larger campaign programs that need commercial terms agreed directly with ZingZing.',
    capacity: 'Custom setup',
    features: [
      'Custom plan discussion for multi-brand programs',
      'Manual support through the existing support channel',
      'Use the same campaign, order, payment, and analytics workspace',
      'No automatic checkout or billing workflow is implied',
      'Best for agencies and regional operators',
    ],
    contactOnly: true,
  },
];

const planIcons: Record<PricingPlanId, React.ElementType> = {
  STARTER: Sparkles,
  GROWTH: Zap,
  PRO: PackageCheck,
  CUSTOM: Crown,
};

const platformSignals = [
  { label: 'Monthly creations', value: '5 / 50 / unlimited', icon: PackageCheck },
  { label: 'Creator discovery', value: 'Search, filters, saved creators', icon: Search },
  { label: 'Payments', value: 'Wallet, Safepay top-up, invoices', icon: WalletCards },
  { label: 'Analytics', value: 'Orders, spend, reviews', icon: BarChart3 },
];

const workflowFeatures = [
  'Brand campaigns with budgets, platforms, goals, cities, deliverables, usage terms, and references',
  'Creator marketplace profiles, packages, rate cards, portfolio samples, social stats, and verification badges',
  'Paid, barter, and hybrid packages with order acceptance, deliverable submission, revisions, and approval',
  'In-app messaging, notifications, disputes, reviews, wallet balances, withdrawals, and affiliate tracking',
];

const currentPlanLabel = (tier: BackendPlanTier | null) => {
  if (tier === 'ENTERPRISE') return 'Pro';
  if (!tier) return null;
  return tier.charAt(0) + tier.slice(1).toLowerCase();
};

export default function PricingPage() {
  const { user, hasHydrated } = useAuthStore();
  const isBrand = hasHydrated && user?.role === 'brand';

  const [currentPlan, setCurrentPlan] = useState<BackendPlanTier | null>(null);
  const [selecting, setSelecting] = useState<BackendPlanTier | null>(null);
  const [successPlan, setSuccessPlan] = useState<BackendPlanTier | null>(null);

  useEffect(() => {
    if (!isBrand) return;
    brandsService.getMe().then((brand) => {
      if (brand?.planTier) setCurrentPlan(brand.planTier as BackendPlanTier);
    }).catch(() => undefined);
  }, [isBrand]);

  const handleSelect = async (plan: PricingPlan) => {
    if (!plan.backendTier || plan.backendTier === currentPlan || selecting) return;
    setSelecting(plan.backendTier);
    try {
      await brandsService.selectPlan(plan.backendTier);
      setCurrentPlan(plan.backendTier);
      setSuccessPlan(plan.backendTier);
      setTimeout(() => setSuccessPlan(null), 3000);
    } catch {
      // Keep the visible plan unchanged if the backend rejects the switch.
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <Navbar />

      <main className="px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <section className="overflow-hidden rounded-[1.8rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
            <div className="grid gap-0 lg:grid-cols-[1.12fr_0.88fr]">
              <div className="p-5 sm:p-6 lg:p-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#f0c56e]">
                  <BadgeCheck className="size-3.5" />
                  Brand pricing
                </span>
                <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                  Pay for campaign creation allowance, not imaginary software.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#c7d8ce]">
                  These tiers map to the workflows already built in ZingZing: creator discovery, campaign briefs,
                  package orders, wallet payments, messaging, analytics, verification, and dispute handling.
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {platformSignals.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-[1.15rem] border border-white/12 bg-white/8 px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#e6aa38] text-[#173b2a]">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">{label}</p>
                          <p className="mt-0.5 text-sm font-black leading-5 text-white">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="border-t border-white/10 bg-white/[0.06] p-5 sm:p-6 lg:border-l lg:border-t-0 lg:p-7">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f0c56e]">Current account</p>
                <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-[#102d20]/60 p-4">
                  <p className="text-2xl font-black tracking-tight text-white">
                    {currentPlanLabel(currentPlan) || 'Choose a plan'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#c7d8ce]">
                    {isBrand
                      ? 'Plan switches use the existing brand plan endpoint. Custom commercial terms are handled by contact.'
                      : 'Create a brand account to select a built-in plan, or contact us for custom terms.'}
                  </p>
                </div>
                <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-white/8 p-4">
                  <p className="text-sm font-black text-white">What is not included</p>
                  <p className="mt-2 text-sm leading-6 text-[#c7d8ce]">
                    No seat billing, CRM automation, AI matching, managed reporting suite, or self-serve subscription checkout is advertised here because those are not built in this app.
                  </p>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-4" aria-label="Pricing plans">
            {plans.map((plan) => {
              const isActive = Boolean(plan.backendTier && currentPlan === plan.backendTier);
              const isLoading = Boolean(plan.backendTier && selecting === plan.backendTier);
              const isSuccess = Boolean(plan.backendTier && successPlan === plan.backendTier);
              const Icon = planIcons[plan.id];

              return (
                <article
                  key={plan.id}
                  className={cn(
                    'flex min-h-[31rem] flex-col rounded-[1.45rem] border bg-white p-4 shadow-[0_18px_55px_rgba(38,70,50,0.07)] transition-all sm:p-5',
                    plan.highlighted ? 'border-[#2d6b4e] ring-2 ring-[#2d6b4e]/10' : 'border-[#d9e0d8]',
                    isActive && 'bg-[#eef6f1]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        'grid size-11 place-items-center rounded-2xl',
                        plan.highlighted ? 'bg-[#2d6b4e] text-white' : 'bg-[#f4f2e9] text-[#b77a12]',
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    {isActive ? (
                      <span className="rounded-full border border-[#bcd3c5] bg-[#e7f0ea] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#185c39]">
                        Current
                      </span>
                    ) : plan.highlighted ? (
                      <span className="rounded-full bg-[#fdf4e1] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#9a6b00]">
                        Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">{plan.eyebrow}</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-[#173b2a]">{plan.name}</h2>
                    <div className="mt-3 min-h-[3rem]">
                      <p className="text-2xl font-black tracking-tight text-[#173b2a]">{plan.price}</p>
                      <p className="text-[11px] font-bold text-[#718077]">{plan.cadence}</p>
                    </div>
                    <p className="mt-3 min-h-[4.5rem] text-[13px] leading-6 text-[#647168]">{plan.description}</p>
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] px-3 py-2.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7b867f]">Capacity</p>
                    <p className="mt-1 text-sm font-black text-[#173b2a]">{plan.capacity}</p>
                  </div>

                  <div className="mt-4 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-[13px] font-semibold leading-5 text-[#1e3d2e]">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#2d6b4e]" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    {plan.contactOnly ? (
                      <Button
                        asChild
                        className="h-10 w-full rounded-xl bg-[#173b2a] text-xs font-black text-white hover:bg-[#102d20]"
                      >
                        <Link href="/contact">
                          Contact Us <MessageCircle className="ml-2 size-4" />
                        </Link>
                      </Button>
                    ) : isBrand ? (
                      <Button
                        className={cn(
                          'h-10 w-full rounded-xl text-xs font-black',
                          plan.highlighted && !isActive
                            ? 'bg-[#2d6b4e] text-white hover:bg-[#1f5239]'
                            : 'border-[#d1ddd6] bg-white text-[#2d6b4e] hover:bg-[#e8f0ec]',
                        )}
                        variant={plan.highlighted && !isActive ? 'default' : 'outline'}
                        disabled={isActive || !!selecting}
                        onClick={() => handleSelect(plan)}
                      >
                        {isLoading ? (
                          <><Loader2 className="mr-2 size-4 animate-spin" />Switching...</>
                        ) : isSuccess ? (
                          <><CheckCircle2 className="mr-2 size-4" />Switched</>
                        ) : isActive ? (
                          'Current Plan'
                        ) : (
                          `Select ${plan.name}`
                        )}
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="h-10 w-full rounded-xl bg-[#2d6b4e] text-xs font-black text-white hover:bg-[#1f5239]"
                      >
                        <Link href="/signup">
                          Start as a brand <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.45rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_55px_rgba(38,70,50,0.07)]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-2xl bg-[#e7f0ea] text-[#185c39]">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">Platform fee</p>
                  <h2 className="text-base font-black text-[#173b2a]">Creator payments still run through orders.</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#647168]">
                Plan pricing controls monthly campaign creation allowance. Creator package payments, wallet top-ups, escrow-style order holds,
                and the existing platform fee remain part of the order and payments workflow.
              </p>
            </div>

            <div className="rounded-[1.45rem] border border-[#d9e0d8] bg-white p-5 shadow-[0_18px_55px_rgba(38,70,50,0.07)]">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#b77a12]">Actually available</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {workflowFeatures.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-[#e2e7e1] bg-[#fbfaf5] px-3 py-3 text-[13px] font-semibold leading-5 text-[#1e3d2e]">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
