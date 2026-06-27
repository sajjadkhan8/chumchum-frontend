'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandOfferWizard, type BrandOfferWizardDefaults } from '@/components/brand-offer-wizard';
import { brandsService } from '@/services/brands.service';
import { campaignsService } from '@/services/campaigns.service';
import { normalizeCategories } from '@/lib/categories';
import { toast } from 'sonner';
import type { Brand } from '@/types';

const PLAN_LIMITS: Record<string, number> = {
  STARTER: 2,
  GROWTH: 10,
  ENTERPRISE: Infinity,
};

const TEMPLATES = [
  {
    id: 'tasting',
    icon: '🍽️',
    name: 'Restaurant Tasting',
    description: 'Invite food creators for a tasting event. Get a reel and stories in return.',
    values: {
      title: 'Restaurant Tasting Campaign',
      brief: 'We are inviting food creators to experience our menu and share their authentic review. We want 1 reel and 2 stories per creator.',
      offerType: 'barter',
      budgetMin: 0,
      budgetMax: 5000,
      currency: 'PKR',
      budgetType: 'per_creator',
      campaignGoal: 'brand_awareness',
      deliverables: '1 Instagram Reel + 2 Stories',
      contentFormats: 'reel,story',
      targetPlatforms: 'instagram',
      campaignDuration: 14,
    },
  },
  {
    id: 'product_launch',
    icon: '🚀',
    name: 'Product Launch',
    description: 'Build buzz around a new product with targeted influencer posts.',
    values: {
      title: 'Product Launch Campaign',
      brief: 'We are launching a new product and want creators to showcase its key features to their audience.',
      offerType: 'paid',
      budgetMin: 15000,
      budgetMax: 50000,
      currency: 'PKR',
      budgetType: 'per_creator',
      campaignGoal: 'product_promotion',
      deliverables: '1 Instagram Reel + 1 Feed Post',
      contentFormats: 'reel,post',
      targetPlatforms: 'instagram,tiktok',
      campaignDuration: 30,
    },
  },
  {
    id: 'brand_awareness',
    icon: '📣',
    name: 'Brand Awareness',
    description: 'Increase recognition with consistent, wide-reach content across platforms.',
    values: {
      title: 'Brand Awareness Campaign',
      brief: 'Help us introduce our brand to new audiences. We are looking for authentic storytelling content.',
      offerType: 'paid',
      budgetMin: 10000,
      budgetMax: 30000,
      currency: 'PKR',
      budgetType: 'per_creator',
      campaignGoal: 'brand_awareness',
      deliverables: '2 Stories + 1 Reel',
      contentFormats: 'story,reel',
      targetPlatforms: 'instagram',
      campaignDuration: 21,
    },
  },
  {
    id: 'content_series',
    icon: '🎬',
    name: 'Content Series',
    description: 'Run a multi-episode series with a creator over several consecutive weeks.',
    values: {
      title: 'Content Series Campaign',
      brief: 'We want to partner with a creator for a 4-part content series showcasing our offerings over 4 consecutive weeks.',
      offerType: 'hybrid',
      budgetMin: 30000,
      budgetMax: 80000,
      currency: 'PKR',
      budgetType: 'per_creator',
      campaignGoal: 'engagement',
      deliverables: '4 Reels over 4 weeks',
      contentFormats: 'reel',
      targetPlatforms: 'instagram,youtube',
      campaignDuration: 28,
      maxApplicants: 3,
    },
  },
] as const;

type Template = (typeof TEMPLATES)[number];

type PageState = 'loading' | 'gated' | 'picker' | 'wizard';

const buildCampaignDefaults = (brand: Brand | null): BrandOfferWizardDefaults => {
  const categories = normalizeCategories(brand?.preferredCreatorCategories?.split(','));

  return {
    categories,
  };
};

export default function BrandCampaignCreatePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [brand, setBrand] = useState<Brand | null>(null);
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  const campaignDefaults = useMemo(() => buildCampaignDefaults(brand), [brand]);

  useEffect(() => {
    const init = async () => {
      const [fetchedBrand, campaignsResult] = await Promise.all([
        brandsService.getMe().catch(() => null),
        campaignsService.getBrandCampaigns(0, 100).catch(() => ({ content: [], totalElements: 0, totalPages: 0, last: true })),
      ]);
      setBrand(fetchedBrand);

      const activeCampaigns = (campaignsResult.content ?? []).filter(
        (c) => c.status === 'published' || c.status === 'paused',
      );
      const count = activeCampaigns.length;
      setActiveCampaignCount(count);

      const planTier = fetchedBrand?.planTier ?? 'STARTER';
      const limit = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.STARTER;

      if (count >= limit) {
        setPageState('gated');
      } else {
        setPageState('picker');
      }
    };
    void init();
  }, []);

  const onUseTemplate = async (template: Template) => {
    setIsCreatingFromTemplate(true);
    try {
      const created = await campaignsService.createCampaign({
        categories: campaignDefaults.categories?.join(', '),
        ...template.values,
      });
      toast.success(`"${template.name}" template applied — complete the details below.`);
      router.push(`/brand/campaigns/${created.id}/edit`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign from template');
      setIsCreatingFromTemplate(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-[#185c39] border-t-transparent" />
      </div>
    );
  }

  const planTier = brand?.planTier ?? 'STARTER';
  const limit = PLAN_LIMITS[planTier] ?? PLAN_LIMITS.STARTER;

  if (pageState === 'gated') {
    const upgradeTarget = planTier === 'STARTER' ? 'GROWTH' : 'ENTERPRISE';
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-[#fff1cd] text-3xl">🔒</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#173b2a]">Campaign limit reached</h1>
        <p className="mt-3 leading-7 text-[#647168]">
          Your <span className="font-bold text-[#173b2a]">{planTier}</span> plan allows up to{' '}
          <span className="font-bold text-[#173b2a]">{limit}</span> active campaign{limit !== 1 ? 's' : ''}.
          You currently have <span className="font-bold text-[#173b2a]">{activeCampaignCount}</span> running.
        </p>
        <p className="mt-2 text-sm text-[#647168]">
          Close or archive an existing campaign, or upgrade to {upgradeTarget} for more capacity.
        </p>
        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            className="rounded-full bg-[#e6aa38] px-5 text-[#173b2a] hover:bg-[#d49d30]"
            onClick={() => router.push('/pricing')}
          >
            Upgrade to {upgradeTarget} <Zap className="ml-2 size-4" />
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => router.push('/brand/campaigns')}>
            Manage campaigns
          </Button>
        </div>
      </div>
    );
  }

  if (pageState === 'picker') {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#173b2a]">New campaign</h1>
          <p className="mt-2 text-[#647168]">Start with a template or build from scratch.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <motion.button
              key={template.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              disabled={isCreatingFromTemplate}
              onClick={() => void onUseTemplate(template)}
              className="group relative flex flex-col items-start rounded-[1.5rem] border border-[#d9e0d8] bg-white p-5 text-left shadow-[0_8px_30px_rgba(38,70,50,0.06)] transition hover:border-[#185c39]/50 hover:shadow-[0_12px_40px_rgba(38,70,50,0.1)] disabled:opacity-60"
            >
              <span className="text-3xl">{template.icon}</span>
              <p className="mt-3 text-lg font-extrabold tracking-tight text-[#173b2a]">{template.name}</p>
              <p className="mt-1 text-sm leading-6 text-[#647168]">{template.description}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#185c39] group-hover:underline">
                Use template <ArrowRight className="size-3.5" />
              </span>
            </motion.button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#e1e6df]" />
          <span className="text-xs font-bold text-[#9ba8a1]">OR</span>
          <div className="h-px flex-1 bg-[#e1e6df]" />
        </div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="rounded-full px-6"
            disabled={isCreatingFromTemplate}
            onClick={() => setPageState('wizard')}
          >
            Start from scratch
          </Button>
        </div>
      </div>
    );
  }

  return <BrandOfferWizard initialDefaults={campaignDefaults} />;
}
