'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, CheckCircle2, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  adminService,
  type AdminVerificationBrand,
  type AdminVerificationCreator,
  type AdminCreatorScoreDetails,
  type AmbassadorApplication,
} from '@/services/admin.service';
import type { CreatorBadgeLevel } from '@/types';

type VerificationTab = 'creators' | 'brands' | 'ambassadors';

const limit = 20;
const brandStatuses = ['all', 'pending', 'under review', 'verified', 'rejected'];
const applicationStatuses = ['all', 'draft', 'submitted', 'under_review', 'approved', 'rejected'];
const creatorBadgeLevels: CreatorBadgeLevel[] = ['none', 'verified', 'rising_star', 'pro', 'elite'];

function QueueControls({
  search,
  status,
  statuses,
  onSearchChange,
  onStatusChange,
  onApply,
}: {
  search: string;
  status: string;
  statuses: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApply()}
          placeholder="Search name, email, or ID"
          className="border-[#d1ddd6] pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="border-[#d1ddd6]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="capitalize">{s.replace('_', ' ')}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239]"
        onClick={onApply}
      >
        <Search className="h-4 w-4" /> Apply
      </button>
    </div>
  );
}

function QueuePagination({
  page,
  total,
  isLoading,
  onPageChange,
}: {
  page: number;
  total: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f3f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-[#87938b]">
        {total} results · Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isLoading || page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminVerificationPage() {
  const [activeTab, setActiveTab] = useState<VerificationTab>('creators');
  const [creators, setCreators] = useState<AdminVerificationCreator[]>([]);
  const [brands, setBrands] = useState<AdminVerificationBrand[]>([]);
  const [applications, setApplications] = useState<AmbassadorApplication[]>([]);
  const [totals, setTotals] = useState<Record<VerificationTab, number>>({ creators: 0, brands: 0, ambassadors: 0 });
  const [pages, setPages] = useState<Record<VerificationTab, number>>({ creators: 0, brands: 0, ambassadors: 0 });
  const [searches, setSearches] = useState<Record<VerificationTab, string>>({ creators: '', brands: '', ambassadors: '' });
  const [statuses, setStatuses] = useState<Record<VerificationTab, string>>({ creators: 'all', brands: 'all', ambassadors: 'all' });
  const [brandContact, setBrandContact] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatorScores, setCreatorScores] = useState<Record<string, AdminCreatorScoreDetails | null>>({});
  const [loadingScoreId, setLoadingScoreId] = useState<string | null>(null);
  const [expandedCreatorId, setExpandedCreatorId] = useState<string | null>(null);

  const loadQueue = useCallback(
    async (tab: VerificationTab, nextPage = pages[tab]) => {
      setIsLoading(true);
      try {
        const filters = { search: searches[tab], status: statuses[tab], page: nextPage, limit };
        if (tab === 'creators') {
          const response = await adminService.getVerificationCreators(filters);
          setCreators(response.creators);
          setTotals((current) => ({ ...current, creators: response.total }));
          setPages((current) => ({ ...current, creators: response.page }));
        } else if (tab === 'brands') {
          const response = await adminService.getVerificationBrands(filters);
          setBrands(response.brands);
          setTotals((current) => ({ ...current, brands: response.total }));
          setPages((current) => ({ ...current, brands: response.page }));
        } else {
          const response = await adminService.getAmbassadorApplications(filters);
          setApplications(response.applications);
          setTotals((current) => ({ ...current, ambassadors: response.total }));
          setPages((current) => ({ ...current, ambassadors: response.page }));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to load verification queue');
      } finally {
        setIsLoading(false);
      }
    },
    [pages, searches, statuses],
  );

  useEffect(() => {
    void loadQueue(activeTab);
  }, [activeTab]);

  const updateCreator = async (creator: AdminVerificationCreator, verified: boolean) => {
    setUpdatingId(creator.id);
    try {
      const updated = await adminService.updateCreatorVerification(creator.id, verified);
      setCreators((current) => current.map((item) => (item.id === creator.id ? updated : item)));
      toast.success(verified ? 'Creator verified' : 'Creator verification removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update creator');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateCreatorBadge = async (creator: AdminVerificationCreator, badgeLevel: CreatorBadgeLevel) => {
    setUpdatingId(creator.id);
    try {
      const updated = await adminService.updateCreatorBadge(creator.id, badgeLevel);
      setCreators((current) => current.map((item) => (item.id === creator.id ? updated : item)));
      toast.success('Creator badge updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update creator badge');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateBrand = async (brand: AdminVerificationBrand, status: string) => {
    setUpdatingId(brand.id);
    try {
      await adminService.updateBrandVerification(
        brand.id,
        status,
        brandContact[brand.id] || brand.verification_contact_email || brand.user?.email,
      );
      setBrands((current) =>
        current.map((item) => (item.id === brand.id ? { ...item, business_verification_status: status } : item)),
      );
      toast.success('Brand verification updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update brand');
    } finally {
      setUpdatingId(null);
    }
  };

  const reviewApplication = async (application: AmbassadorApplication, status: string) => {
    setUpdatingId(application.id);
    try {
      const updated = await adminService.reviewAmbassadorApplication(application.id, status, 'Reviewed from admin console');
      setApplications((current) => current.map((item) => (item.id === application.id ? updated : item)));
      toast.success('Application reviewed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to review application');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleCreatorScore = async (creatorId: string) => {
    if (expandedCreatorId === creatorId) { setExpandedCreatorId(null); return; }
    setExpandedCreatorId(creatorId);
    if (Object.prototype.hasOwnProperty.call(creatorScores, creatorId)) return;
    setLoadingScoreId(creatorId);
    const details = await adminService.getCreatorScoreDetails(creatorId);
    setCreatorScores((prev) => ({ ...prev, [creatorId]: details }));
    setLoadingScoreId(null);
  };

  const controls = (tab: VerificationTab, options: string[]) => (
    <QueueControls
      search={searches[tab]}
      status={statuses[tab]}
      statuses={options}
      onSearchChange={(value) => setSearches((current) => ({ ...current, [tab]: value }))}
      onStatusChange={(value) => setStatuses((current) => ({ ...current, [tab]: value }))}
      onApply={() => loadQueue(tab, 0)}
    />
  );

  const pagination = (tab: VerificationTab) => (
    <QueuePagination
      page={pages[tab]}
      total={totals[tab]}
      isLoading={isLoading}
      onPageChange={(page) => loadQueue(tab, page)}
    />
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Verification</h1>
          <p className="mt-1 text-sm text-[#496159]">Creator, brand, and ambassador trust operations.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={() => loadQueue(activeTab)}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VerificationTab)}>
        <TabsList className="gap-1 rounded-xl border border-[#e2e7e1] bg-[#f9faf8] p-1">
          <TabsTrigger
            value="creators"
            className="rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Creators
          </TabsTrigger>
          <TabsTrigger
            value="brands"
            className="rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Brands
          </TabsTrigger>
          <TabsTrigger
            value="ambassadors"
            className="rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            Ambassadors
          </TabsTrigger>
        </TabsList>

        {/* Creators tab */}
        <TabsContent value="creators" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Creator trust</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Creator Verification</h2>
            </div>
            <div className="p-5">
              {controls('creators', ['all', 'verified', 'unverified'])}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Creator</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Verification</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Badge level</TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-[#496159]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((creator) => (
                    <React.Fragment key={creator.id}>
                      <TableRow className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                        <TableCell>
                          <p className="text-[13px] font-semibold text-[#1e3d2e]">{creator.name}</p>
                          <p className="text-[11px] text-[#87938b]">{creator.email || creator.username}</p>
                        </TableCell>
                        <TableCell>
                          {creator.is_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="size-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0ec] px-2.5 py-0.5 text-[11px] font-bold text-[#496159]">
                              Unverified
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={creator.badge_level || 'none'}
                            disabled={updatingId === creator.id || !creator.is_verified}
                            onValueChange={(value) => updateCreatorBadge(creator, value as CreatorBadgeLevel)}
                          >
                            <SelectTrigger className="w-[10rem] capitalize border-[#d1ddd6]">
                              <Award className="h-4 w-4 text-[#2d6b4e]" />
                              <span>{(creator.badge_level || 'none').replace('_', ' ')}</span>
                            </SelectTrigger>
                            <SelectContent>
                              {creatorBadgeLevels
                                .filter((level) => level !== 'none')
                                .map((level) => (
                                  <SelectItem key={level} value={level} className="capitalize">
                                    {level.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="ml-2 rounded-lg border border-[#d9e0d8] px-2.5 py-1 text-xs font-bold text-[#185c39] hover:bg-[#f4f2e9]"
                              onClick={() => void toggleCreatorScore(creator.id)}
                            >
                              {expandedCreatorId === creator.id ? 'Hide' : 'Score'}
                            </button>
                            {creator.is_verified ? (
                              <button
                                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#d1ddd6] px-3 text-[11px] font-bold text-[#496159] transition hover:bg-[#e8f0ec] disabled:opacity-50"
                                disabled={updatingId === creator.id}
                                onClick={() => updateCreator(creator, false)}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Remove
                              </button>
                            ) : (
                              <button
                                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#2d6b4e] px-3 text-[11px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                                disabled={updatingId === creator.id}
                                onClick={() => updateCreator(creator, true)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedCreatorId === creator.id ? (
                        <TableRow>
                          <TableCell colSpan={4} className="bg-[#f4f8f5] px-4 py-4">
                            {loadingScoreId === creator.id ? (
                              <p className="text-xs text-muted-foreground">Loading score…</p>
                            ) : creatorScores[creator.id] ? (() => {
                              const s = creatorScores[creator.id]!;
                              const bars = [
                                { label: 'Delivery', val: s.score.deliveryScore, max: 35 },
                                { label: 'Rating', val: s.score.ratingScore, max: 25 },
                                { label: 'Account age', val: s.score.accountAgeScore, max: 15 },
                                { label: 'Cancellation', val: s.score.cancellationScore, max: 10 },
                                { label: 'Profile', val: s.score.profileCompletenessScore, max: 10 },
                                { label: 'Consistency', val: s.score.consistencyScore, max: 5 },
                              ];
                              return (
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-3xl font-extrabold text-[#173b2a]">{s.score.total}</span>
                                      <span className="text-sm text-[#9ba8a1]">/ 100</span>
                                    </div>
                                    <span className="rounded-full bg-[#fff1cd] px-3 py-1 text-xs font-extrabold capitalize text-[#8b5e12]">
                                      {s.tier.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-xs text-[#9ba8a1]">Top {s.percentileRank}% of creators</span>
                                    {s.nextTierPoints ? (
                                      <span className="text-xs font-bold text-[#185c39]">+{s.nextTierPoints} pts to next tier</span>
                                    ) : null}
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    {bars.map((b) => (
                                      <div key={b.label} className="rounded-xl bg-white p-2.5">
                                        <div className="flex justify-between text-xs font-bold">
                                          <span className="text-[#526259]">{b.label}</span>
                                          <span className="text-[#173b2a]">{b.val}/{b.max}</span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e6eceb]">
                                          <div className="h-full rounded-full bg-[#185c39]" style={{ width: `${Math.round((b.val / b.max) * 100)}%` }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {s.strengths.length > 0 && (
                                    <div>
                                      <p className="mb-1.5 text-xs font-bold text-[#185c39]">Strengths</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {s.strengths.map((str) => (
                                          <span key={str} className="rounded-full bg-[#e7f0ea] px-2.5 py-1 text-xs font-bold text-[#185c39]">{str}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {s.improvements.length > 0 && (
                                    <div>
                                      <p className="mb-1.5 text-xs font-bold text-[#8b5e12]">To improve</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {s.improvements.map((imp) => (
                                          <span key={imp} className="rounded-full bg-[#fff1cd] px-2.5 py-1 text-xs font-bold text-[#8b5e12]">{imp}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })() : (
                              <p className="text-xs text-muted-foreground">Score data not available for this creator.</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </React.Fragment>
                  ))}
                  {!isLoading && creators.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <CheckCircle2 className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">No items found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {pagination('creators')}
            </div>
          </div>
        </TabsContent>

        {/* Brands tab */}
        <TabsContent value="brands" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Brand trust</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Brand Verification</h2>
            </div>
            <div className="p-5">
              {controls('brands', brandStatuses)}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Brand</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Contact</TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell>
                        <p className="text-[13px] font-semibold text-[#1e3d2e]">{brand.name}</p>
                        <p className="text-[11px] text-[#87938b]">{brand.user?.email}</p>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={brandContact[brand.id] ?? ''}
                          placeholder={brand.verification_contact_email || brand.user?.email}
                          className="border-[#d1ddd6]"
                          onChange={(event) =>
                            setBrandContact((current) => ({ ...current, [brand.id]: event.target.value }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select
                            value={(brand.business_verification_status || 'pending').toLowerCase()}
                            disabled={updatingId === brand.id}
                            onValueChange={(status) => updateBrand(brand, status)}
                          >
                            <SelectTrigger className="w-[10rem] border-[#d1ddd6]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {brandStatuses.slice(1).map((status) => (
                                <SelectItem key={status} value={status}>
                                  <span className="capitalize">{status}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && brands.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <ShieldCheck className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">No items found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {pagination('brands')}
            </div>
          </div>
        </TabsContent>

        {/* Ambassadors tab */}
        <TabsContent value="ambassadors" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Ambassador trust</p>
              <h2 className="mt-0.5 flex items-center gap-2 text-[15px] font-extrabold text-[#1e3d2e]">
                <ShieldCheck className="h-4 w-4 text-[#2d6b4e]" />
                Ambassador Applications
              </h2>
            </div>
            <div className="p-5">
              {controls('ambassadors', applicationStatuses)}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Applicant</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Checks</TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-[#496159]">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell>
                        <p className="text-[13px] font-semibold text-[#1e3d2e]">
                          {application.creatorName || application.creatorId.slice(0, 8)}
                        </p>
                        <p className="text-[11px] text-[#87938b]">{application.creatorEmail || application.id.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              ['Identity', application.identityVerified],
                              ['Engagement', application.engagementVerified],
                              ['Content', application.contentReviewPassed],
                              ['Background', application.backgroundCheckPassed],
                            ] as [string, boolean][]
                          ).map(([label, passed]) =>
                            passed ? (
                              <span
                                key={label}
                                className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700"
                              >
                                {label}
                              </span>
                            ) : (
                              <span
                                key={label}
                                className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2 py-0.5 text-[10px] font-bold text-[#87938b]"
                              >
                                {label}
                              </span>
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select
                            value={application.status?.toUpperCase() || 'UNDER_REVIEW'}
                            disabled={updatingId === application.id}
                            onValueChange={(status) => reviewApplication(application, status)}
                          >
                            <SelectTrigger className="w-[10rem] border-[#d1ddd6]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.replace('_', ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <Award className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">No items found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {pagination('ambassadors')}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
