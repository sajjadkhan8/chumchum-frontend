'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Eye,
  MapPin,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { campaignsService, type BrandCampaignQuota } from '@/services/campaigns.service';
import { brandsService } from '@/services/brands.service';
import type { Brand, BrandCampaign, BrandCampaignStatus } from '@/types';
import { cn, formatPrice, formatRelativeTime } from '@/lib/utils';

const statusTabs: Array<{ value: 'all' | BrandCampaignStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Live' },
  { value: 'draft', label: 'Drafts' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const statusTone: Record<BrandCampaignStatus, string> = {
  published: 'bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]',
  draft: 'bg-[#fff1cd] text-[#8b5e12] ring-[#efcf83]',
  paused: 'bg-[#f5e7cf] text-[#8b5e12] ring-[#e6c792]',
  closed: 'bg-[#eef2eb] text-[#526259] ring-[#d5ddd6]',
  archived: 'bg-[#f2eee7] text-[#6d6258] ring-[#ddd2c7]',
};

const referencesScore = (campaign: BrandCampaign) => {
  const checks = [
    campaign.keyMessage,
    campaign.dosAndDonts,
    campaign.hashtagsMentions,
    campaign.referenceUrls,
    campaign.usageRights,
    campaign.termsAndConditions,
    campaign.expectedOutcomes,
  ];
  return checks.filter((value) => Boolean(value && value.trim().length > 0)).length;
};

const locationLabel = (campaign: BrandCampaign) => {
  if (campaign.locationTargetingMode === 'remote_only') return 'Remote / Online only';
  if (campaign.locationTargetingMode === 'region') return campaign.targetRegion || campaign.targetCity || 'Region';
  if (campaign.locationTargetingMode === 'cities') return campaign.targetCities || campaign.targetCity || 'Selected cities';
  return 'Nationwide';
};

const campaignTypeLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const campaignBudgetLabel = (campaign: BrandCampaign) => {
  if (campaign.budgetType === 'barter_only') return 'Barter only';
  if (campaign.budgetType === 'fixed' || campaign.budgetMin === campaign.budgetMax) {
    return formatPrice(campaign.budgetMin);
  }
  return `${formatPrice(campaign.budgetMin)} - ${formatPrice(campaign.budgetMax)}`;
};

function EmptyState({ activeTab }: { activeTab: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-[#cdd7ce] bg-white p-6 text-center shadow-[0_18px_60px_rgba(38,70,50,0.06)]">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f2e9] text-[#b77a12]">
        <Megaphone className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-black tracking-[-0.04em] text-[#173b2a]">
        {activeTab === 'all' ? 'No campaigns yet.' : `No ${activeTab} campaigns yet.`}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#647168]">
        Create a compact food campaign brief for tastings, launch reels, hotel stays, cafe openings, dessert drops, or fast-food promos.
      </p>
      <Button asChild className="mt-5 rounded-full bg-[#185c39] px-5 font-extrabold text-white hover:bg-[#12462b]">
        <Link href="/brand/campaigns/new">
          <Plus className="mr-2 size-4" />
          Create Campaign
        </Link>
      </Button>
    </div>
  );
}

const STARTER_CAMPAIGN_LIMIT = 5;
const GROWTH_CAMPAIGN_LIMIT = 50;

const planBadgeStyle: Record<string, string> = {
  STARTER: 'bg-[#f4f2e9] text-[#7a6b4e] ring-[#ddd3bc]',
  GROWTH: 'bg-[#e7f0ea] text-[#185c39] ring-[#bcd3c5]',
  ENTERPRISE: 'bg-[#e8edf8] text-[#2b4faa] ring-[#b8c6e8]',
};

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | BrandCampaignStatus>('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [campaignQuota, setCampaignQuota] = useState<BrandCampaignQuota | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async (nextPage = 0, append = false, tab: 'all' | BrandCampaignStatus = 'all') => {
    setIsLoading(true);
    const status = tab === 'all' ? undefined : tab.toUpperCase();
    const result = await campaignsService.getBrandCampaigns(nextPage, 20, status).catch(() => ({ content: [], totalElements: 0, totalPages: 1, last: true }));
    setCampaigns(append ? (prev) => [...prev, ...result.content] : result.content);
    setTotalElements(result.totalElements);
    setTotalPages(result.totalPages);
    setPage(nextPage);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load(0, false, 'all');
    void campaignsService.getBrandCampaignQuota().then(setCampaignQuota).catch(() => null);
    brandsService.getMe().then(setBrand).catch(() => null);
  }, [load]);

  useEffect(() => {
    void load(0, false, activeTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return campaigns;

    return campaigns.filter((campaign) => {
      const searchable = [
        campaign.title,
        campaign.brief,
        campaign.offerType,
        campaign.status,
        campaign.targetCity,
        campaign.targetCities,
        campaign.targetRegion,
        locationLabel(campaign),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [campaigns, searchQuery]);

  const activeStatusLabel = statusTabs.find((tab) => tab.value === activeTab)?.label ?? 'All';
  const monthlyQuotaUsed = campaignQuota?.used ?? totalElements;
  const monthlyQuotaLimit = campaignQuota?.limit ?? (brand?.planTier === 'GROWTH' ? GROWTH_CAMPAIGN_LIMIT : STARTER_CAMPAIGN_LIMIT);
  const monthlyQuotaReached = !campaignQuota?.unlimited && monthlyQuotaUsed >= monthlyQuotaLimit;
  const monthlyQuotaPercent = monthlyQuotaLimit > 0 ? Math.min((monthlyQuotaUsed / monthlyQuotaLimit) * 100, 100) : 0;
  const hasMonthlyQuota = Boolean(brand?.planTier && brand.planTier !== 'ENTERPRISE' && !campaignQuota?.unlimited);
  const quotaUpgradeLabel = brand?.planTier === 'GROWTH' ? 'Pro' : 'Growth';
  const quotaUpgradeCopy = brand?.planTier === 'GROWTH' ? 'upgrade to Pro' : 'upgrade to Growth';

  return (
    <div className="min-h-screen bg-[#fbfaf5]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#d9e0d8] bg-[#173b2a] text-white shadow-[0_24px_80px_rgba(23,59,42,0.14)]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#f0c56e]">
                    <Sparkles className="size-3.5" />
                    Food campaign desk
                  </div>
                  {brand?.planTier && (
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ring-1', planBadgeStyle[brand.planTier] ?? planBadgeStyle.STARTER)}>
                      {brand.planTier.charAt(0) + brand.planTier.slice(1).toLowerCase()} plan
                    </span>
                  )}
                </div>
                {hasMonthlyQuota && (
                  <div className="mt-3 max-w-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#d4e0d8]">
                      <span>Monthly creation allowance</span>
                      <span className={monthlyQuotaReached ? 'text-[#f0c56e]' : 'text-white'}>
                        {Math.min(monthlyQuotaUsed, monthlyQuotaLimit)}/{monthlyQuotaLimit}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                      <div
                        className={cn('h-full rounded-full transition-all', monthlyQuotaReached ? 'bg-[#e6aa38]' : 'bg-[#6ec996]')}
                        style={{ width: `${monthlyQuotaPercent}%` }}
                      />
                    </div>
                    <p className={cn('mt-1.5 text-[11px] font-bold', monthlyQuotaReached ? 'text-[#f0c56e]' : 'text-[#d4e0d8]')}>
                      {monthlyQuotaReached ? (
                        <>
                          Limit reached — <Link href="/pricing" className="underline">{quotaUpgradeCopy}</Link> to create more.
                        </>
                      ) : (
                        <>Archived campaigns still count toward this month&apos;s allowance.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
              {hasMonthlyQuota && monthlyQuotaReached ? (
                <Button asChild className="shrink-0 rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bb55]">
                  <Link href="/pricing">
                    Upgrade to {quotaUpgradeLabel}
                  </Link>
                </Button>
              ) : (
                <Button asChild className="shrink-0 rounded-full bg-[#e6aa38] px-5 font-black text-[#173b2a] hover:bg-[#f0bb55]">
                  <Link href="/brand/campaigns/new">
                    <Plus className="mr-2 size-4" />
                    New Campaign
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.5rem] border border-[#d9e0d8] bg-white p-3 shadow-[0_16px_54px_rgba(38,70,50,0.06)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px] lg:min-w-[560px]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7b867f]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search campaigns..."
                  className="h-11 rounded-full border-[#d9e0d8] bg-[#fbfaf5] pl-10 pr-4 font-bold text-[#173b2a] placeholder:text-[#8a968f]"
                />
              </div>
              <Select value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | BrandCampaignStatus)}>
                <SelectTrigger className="h-11 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusTabs.map((tab) => (
                    <SelectItem key={tab.value} value={tab.value}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#647168]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2e9] px-3 py-2">
                <ClipboardList className="size-3.5 text-[#b77a12]" />
                {searchQuery.trim() ? `${filtered.length} matching ${activeStatusLabel.toLowerCase()} campaigns` : totalElements > 0 ? `${totalElements} ${activeStatusLabel.toLowerCase()} campaigns` : 'Campaign list ready'}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-[#185c39] hover:bg-[#e7f0ea] hover:text-[#185c39]"
                onClick={() => void load(0, false, activeTab)}
                disabled={isLoading}
              >
                <RefreshCw className={cn('mr-2 size-3.5', isLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-4">
          {isLoading && campaigns.length === 0 ? (
            <div className="rounded-[1.6rem] border border-[#d9e0d8] bg-white p-6 text-center text-sm font-bold text-[#647168] shadow-[0_18px_60px_rgba(38,70,50,0.06)]">
              Loading your campaigns...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState activeTab={activeTab} />
          ) : (
            <div className="grid gap-3">
              {filtered.map((campaign) => {
                const refScore = referencesScore(campaign);
                return (
                  <article
                    key={campaign.id}
                    className="group rounded-[1.45rem] border border-[#d9e0d8] bg-white p-4 shadow-[0_14px_45px_rgba(38,70,50,0.055)] transition hover:-translate-y-0.5 hover:border-[#b7c8bd] hover:shadow-[0_22px_70px_rgba(38,70,50,0.10)] sm:p-5"
                  >
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn('rounded-full px-2.5 py-1 text-[11px] font-black capitalize ring-1', statusTone[campaign.status])}>
                            {campaign.status.replace('_', ' ')}
                          </Badge>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f2e9] px-2.5 py-1 text-[11px] font-black text-[#607168]">
                            <MapPin className="size-3.5 text-[#b77a12]" />
                            {locationLabel(campaign)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h2 className="line-clamp-1 text-xl font-black tracking-[-0.04em] text-[#173b2a]">{campaign.title}</h2>
                            <p className="mt-1 text-sm font-bold text-[#718077]">{campaignTypeLabel(campaign.offerType)}</p>
                          </div>
                          <p className="shrink-0 rounded-full bg-[#fff1cd] px-3 py-1.5 text-sm font-black text-[#8b5e12]">
                            {campaignBudgetLabel(campaign)}
                          </p>
                        </div>

                        <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-6 text-[#647168]">{campaign.brief}</p>

                        <div className="mt-4 grid gap-2 text-sm font-bold text-[#607168] sm:grid-cols-3">
                          {campaign.reactionCount > 0 ? (
                            <Link
                              href={`/brand/campaigns/${campaign.id}?tab=reactions`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[#fff1cd] px-3 py-2 text-sm font-bold text-[#8b5e12] transition hover:bg-[#fce8a8]"
                            >
                              {campaign.status === 'published' && (
                                <span className="relative flex size-2">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e6aa38] opacity-75" />
                                  <span className="relative inline-flex size-2 rounded-full bg-[#e6aa38]" />
                                </span>
                              )}
                              <Users className="size-4 text-[#b77a12]" />
                              {campaign.reactionCount} {campaign.reactionCount === 1 ? 'creator interested' : 'creators interested'}
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2 text-sm font-bold text-[#607168]">
                              <Users className="size-4 text-[#185c39]" />
                              No reactions yet
                            </span>
                          )}
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                            <CalendarClock className="size-4 text-[#185c39]" />
                            Updated {formatRelativeTime(campaign.updatedAt)}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-[#fbfaf5] px-3 py-2">
                            <ClipboardList className="size-4 text-[#185c39]" />
                            Brief refs {refScore}/7
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-row gap-2 lg:flex-col lg:items-stretch">
                        <Button asChild className="flex-1 rounded-full bg-[#185c39] font-black text-white hover:bg-[#12462b] lg:flex-none">
                          <Link href={`/brand/campaigns/${campaign.id}`}>
                            Manage <ArrowRight className="ml-2 size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1 rounded-full border-[#d9e0d8] bg-[#fbfaf5] font-black text-[#185c39] hover:bg-[#e7f0ea] lg:flex-none">
                          <Link href={`/brand/campaigns/${campaign.id}/edit`}>
                            <Eye className="mr-2 size-4" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {page < totalPages - 1 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => void load(page + 1, true, activeTab)}
                disabled={isLoading}
                className="rounded-full border-[#d9e0d8] bg-white px-6 font-black text-[#185c39] hover:bg-[#e7f0ea]"
              >
                {isLoading ? 'Loading...' : 'Load more campaigns'}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
