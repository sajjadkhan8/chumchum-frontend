'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  Crown,
  LockKeyhole,
  Megaphone,
  Rocket,
  Sparkles,
  Target,
  Utensils,
  WalletCards,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandOfferWizard, type BrandOfferWizardDefaults } from '@/components/brand-offer-wizard';
import { brandsService } from '@/services/brands.service';
import { campaignsService, type BrandCampaignQuota } from '@/services/campaigns.service';
import { normalizeCategories } from '@/lib/categories';
import type { Brand } from '@/types';

const WIZARD_DRAFT_KEY = 'brand-offer-wizard-draft-v1';

const TEMPLATES = [
  {
    id: 'tasting',
    icon: Utensils,
    name: 'Restaurant Tasting',
    description: 'Invite food creators for a tasting event. Get a reel and stories in return.',
    values: {
      title: 'Restaurant Tasting Campaign',
      brief: 'We are inviting food creators to experience our menu and share their authentic review. We want 1 reel and 2 stories per creator.',
      offerType: 'instagram',
      budgetMin: '500',
      budgetMax: '5000',
      budgetType: 'paid_and_barter',
      barterProductDesc: 'Restaurant tasting experience for the selected creator.',
      barterEstimatedValue: '5000',
      deliverableItems: [
        { id: 'instagram::template_reel', label: 'Instagram Reel', quantity: 1 },
        { id: 'instagram::template_stories', label: 'Instagram Stories', quantity: 2 },
      ],
      contentFormats: ['reel', 'story'],
      targetPlatforms: ['instagram'],
      campaignDuration: '14',
    },
  },
  {
    id: 'product_launch',
    icon: Rocket,
    name: 'Product Launch',
    description: 'Build buzz around a new product with targeted influencer posts.',
    values: {
      title: 'Product Launch Campaign',
      brief: 'We are launching a new product and want creators to showcase its key features to their audience.',
      offerType: 'instagram',
      budgetMin: '15000',
      budgetMax: '50000',
      budgetType: 'open_to_bids',
      deliverableItems: [
        { id: 'instagram::template_reel', label: 'Instagram Reel', quantity: 1 },
        { id: 'instagram::template_feed_post', label: 'Instagram Feed Post', quantity: 1 },
      ],
      contentFormats: ['reel', 'post'],
      targetPlatforms: ['instagram'],
      campaignDuration: '30',
    },
  },
  {
    id: 'brand_awareness',
    icon: Megaphone,
    name: 'Brand Awareness',
    description: 'Increase recognition with consistent, wide-reach content across platforms.',
    values: {
      title: 'Brand Awareness Campaign',
      brief: 'Help us introduce our brand to new audiences. We are looking for authentic storytelling content.',
      offerType: 'instagram',
      budgetMin: '10000',
      budgetMax: '30000',
      budgetType: 'open_to_bids',
      deliverableItems: [
        { id: 'instagram::template_stories', label: 'Instagram Stories', quantity: 2 },
        { id: 'instagram::template_reel', label: 'Instagram Reel', quantity: 1 },
      ],
      contentFormats: ['story', 'reel'],
      targetPlatforms: ['instagram'],
      campaignDuration: '21',
    },
  },
  {
    id: 'content_series',
    icon: Clapperboard,
    name: 'Content Series',
    description: 'Run a multi-episode series with a creator over several consecutive weeks.',
    values: {
      title: 'Content Series Campaign',
      brief: 'We want to partner with a creator for a 4-part content series showcasing our offerings over 4 consecutive weeks.',
      offerType: 'instagram',
      budgetMin: '30000',
      budgetMax: '80000',
      budgetType: 'paid_and_barter',
      barterProductDesc: 'Product or service experience to support the content series.',
      deliverableItems: [
        { id: 'instagram::template_reel_series', label: 'Instagram Reels over 4 weeks', quantity: 4 },
      ],
      contentFormats: ['reel'],
      targetPlatforms: ['instagram'],
      campaignDuration: '28',
      maxApplicants: '3',
    },
  },
] as const;

type Template = (typeof TEMPLATES)[number];

type PageState = 'loading' | 'gated' | 'picker' | 'wizard';

const formatLimit = (quota: BrandCampaignQuota | null) => (quota?.unlimited ? 'Unlimited' : String(quota?.limit ?? 5));

const buildCampaignDefaults = (brand: Brand | null): BrandOfferWizardDefaults => {
  const categories = normalizeCategories([brand?.category]).slice(0, 1);

  return {
    categories,
  };
};

export default function BrandCampaignCreatePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaignQuota, setCampaignQuota] = useState<BrandCampaignQuota | null>(null);
  const [selectedTemplateDefaults, setSelectedTemplateDefaults] = useState<BrandOfferWizardDefaults | null>(null);
  const campaignDefaults = useMemo(() => buildCampaignDefaults(brand), [brand]);

  useEffect(() => {
    const init = async () => {
      const [fetchedBrand, quota] = await Promise.all([
        brandsService.getMe().catch(() => null),
        campaignsService.getBrandCampaignQuota().catch(() => null),
      ]);
      setBrand(fetchedBrand);
      setCampaignQuota(quota);

      if (quota && !quota.unlimited && quota.used >= (quota.limit ?? 5)) {
        setPageState('gated');
      } else {
        setPageState('picker');
      }
    };
    void init();
  }, []);

  const openWizardWithDefaults = (defaults?: BrandOfferWizardDefaults) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(WIZARD_DRAFT_KEY);
    }
    setSelectedTemplateDefaults(defaults ?? null);
    setPageState('wizard');
  };

  const onUseTemplate = (template: Template) => {
    openWizardWithDefaults({
      ...campaignDefaults,
      ...template.values,
    });
  };

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#185c39] border-t-transparent" />
      </div>
    );
  }

  const planTier = brand?.planTier ?? 'STARTER';
  const limitLabel = formatLimit(campaignQuota);
  const usedThisMonth = campaignQuota?.used ?? 0;

  if (pageState === 'gated') {
    const upgradeTarget = planTier === 'STARTER' ? 'Growth' : 'Pro';
    return (
      <div className="min-h-full bg-[#fbfaf5] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[980px] space-y-5">
          <button
            type="button"
            onClick={() => router.push('/brand/campaigns')}
            className="inline-flex items-center gap-1.5 text-[12px] font-extrabold text-[#2d6b4e] transition hover:text-[#1e3d2e]"
          >
            <ArrowLeft className="size-3.5" />
            Back to campaigns
          </button>

          <section className="relative overflow-hidden rounded-2xl bg-[#1e3d2e] p-5 text-white shadow-[0_18px_60px_rgba(30,61,46,0.18)] sm:p-6">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#2d6b4e] opacity-40 blur-3xl" />
              <div className="absolute -bottom-16 -left-12 size-52 rounded-full bg-[#e6aa38] opacity-10 blur-3xl" />
            </div>
            <div className="relative grid gap-5 md:grid-cols-[1fr_280px] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                    <LockKeyhole className="size-3" />
                    Plan limit
                  </span>
                  <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] font-bold text-white/50">
                    {planTier}
                  </span>
                </div>
                <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
                  Monthly creation allowance is used.
                </h1>
                <p className="mt-2 max-w-xl text-[13px] leading-6 text-white/55">
                  Your current plan includes {limitLabel} campaign creations per month. Archived campaigns still count, so move up to {upgradeTarget} to keep launching this month.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    className="min-h-9 rounded-xl bg-[#e6aa38] px-4 text-[12px] font-extrabold text-[#1e3d2e] hover:bg-[#f0bd58]"
                    onClick={() => router.push('/pricing')}
                  >
                    Upgrade to {upgradeTarget} <Zap className="ml-1.5 size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-9 rounded-xl border-white/15 bg-white/8 px-4 text-[12px] font-semibold text-white hover:bg-white/12 hover:text-white"
                    onClick={() => router.push('/brand/campaigns')}
                  >
                    Manage campaigns
                  </Button>
                </div>
              </div>

              <div className="grid gap-2.5">
                {[
                  { label: 'Used this month', value: usedThisMonth, icon: Target },
                  { label: 'Monthly allowance', value: limitLabel, icon: WalletCards },
                  { label: 'Next tier', value: upgradeTarget, icon: Crown },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-white/12 bg-white/8 px-3 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f0c56e]">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#d4e0d8]">{label}</p>
                        <p className="mt-0.5 text-base font-black text-white">{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (pageState === 'picker') {
    return (
      <div className="min-h-full bg-[#fbfaf5] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <section className="relative overflow-hidden rounded-2xl bg-[#1e3d2e] p-5 text-white shadow-[0_18px_60px_rgba(30,61,46,0.18)] sm:p-6">
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-[#2d6b4e] opacity-40 blur-3xl" />
              <div className="absolute -bottom-16 -left-12 size-52 rounded-full bg-[#e6aa38] opacity-10 blur-3xl" />
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#f0c56e]">
                  <Sparkles className="size-3" />
                  Campaign builder
                </span>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[10px] font-bold text-white/50">
                  {usedThisMonth} / {limitLabel} used this month
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="min-h-9 rounded-xl bg-[#e6aa38] px-4 text-[12px] font-extrabold text-[#1e3d2e] hover:bg-[#f0bd58]"
                  onClick={() => openWizardWithDefaults(campaignDefaults)}
                >
                  Start from scratch <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  className="min-h-9 rounded-xl border-white/15 bg-white/8 px-4 text-[12px] font-semibold text-white hover:bg-white/12 hover:text-white"
                  onClick={() => router.push('/brand/campaigns')}
                >
                  View campaigns
                </Button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f3f0] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Campaign templates</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Pick a starting point</h2>
              </div>
              <span className="rounded-full border border-[#d1ddd6] bg-[#f9faf8] px-3 py-1 text-[11px] font-bold text-[#496159]">
                {TEMPLATES.length} presets
              </span>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <motion.button
                    key={template.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onUseTemplate(template)}
                    className="group flex min-h-[210px] flex-col rounded-xl border border-[#dde5df] bg-[#f9faf8] p-4 text-left transition hover:border-[#2d6b4e] hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f0ec] text-[#2d6b4e] transition-colors group-hover:bg-[#2d6b4e] group-hover:text-white">
                        <Icon className="size-4.5" />
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-[#b5c0bc] transition-transform group-hover:translate-x-0.5 group-hover:text-[#2d6b4e]" />
                    </div>
                    <p className="mt-4 text-[15px] font-extrabold tracking-tight text-[#1e3d2e]">{template.name}</p>
                    <p className="mt-2 flex-1 text-[12px] leading-5 text-[#647168]">{template.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#2d6b4e]">
                      Use template
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return <BrandOfferWizard initialDefaults={selectedTemplateDefaults ?? campaignDefaults} />;
}
