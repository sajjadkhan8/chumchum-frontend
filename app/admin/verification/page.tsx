'use client';

import { useCallback, useEffect, useState } from 'react';
import { Award, CheckCircle2, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  adminService,
  type AdminVerificationBrand,
  type AdminVerificationCreator,
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onApply();
          }}
          placeholder="Search name, email, or ID"
          className="pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((item) => (
            <SelectItem key={item} value={item}>
              <span className="capitalize">{item.replace('_', ' ')}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="min-h-10 gap-2" onClick={onApply}>
        <Search className="h-4 w-4" />
        Apply
      </Button>
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
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {total} results · Page {page + 1} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" disabled={isLoading || page <= 0} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" disabled={isLoading || page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
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

  const loadQueue = useCallback(async (tab: VerificationTab, nextPage = pages[tab]) => {
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
  }, [pages, searches, statuses]);

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
      await adminService.updateBrandVerification(brand.id, status, brandContact[brand.id] || brand.verification_contact_email || brand.user?.email);
      setBrands((current) => current.map((item) => (item.id === brand.id ? { ...item, business_verification_status: status } : item)));
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
    <QueuePagination page={pages[tab]} total={totals[tab]} isLoading={isLoading} onPageChange={(page) => loadQueue(tab, page)} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Verification</h1>
          <p className="text-sm text-muted-foreground">Creator, brand, and ambassador trust operations.</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={() => loadQueue(activeTab)} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VerificationTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="ambassadors">Ambassadors</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Creator Verification</CardTitle></CardHeader>
            <CardContent>
              {controls('creators', ['all', 'verified', 'unverified'])}
              <Table>
                <TableHeader><TableRow><TableHead>Creator</TableHead><TableHead>Verification</TableHead><TableHead>Badge level</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {creators.map((creator) => (
                    <TableRow key={creator.id}>
                      <TableCell><p className="font-medium">{creator.name}</p><p className="text-xs text-muted-foreground">{creator.email || creator.username}</p></TableCell>
                      <TableCell><Badge variant={creator.is_verified ? 'default' : 'secondary'}>{creator.is_verified ? 'Verified' : 'Unverified'}</Badge></TableCell>
                      <TableCell>
                        <Select value={creator.badge_level || 'none'} disabled={updatingId === creator.id || !creator.is_verified} onValueChange={(value) => updateCreatorBadge(creator, value as CreatorBadgeLevel)}>
                          <SelectTrigger className="w-[10rem] capitalize"><Award className="h-4 w-4" /><span>{(creator.badge_level || 'none').replace('_', ' ')}</span></SelectTrigger>
                          <SelectContent>{creatorBadgeLevels.filter((level) => level !== 'none').map((level) => <SelectItem key={level} value={level} className="capitalize">{level.replace('_', ' ')}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant={creator.is_verified ? 'outline' : 'default'} size="sm" className="gap-2" disabled={updatingId === creator.id} onClick={() => updateCreator(creator, !creator.is_verified)}>
                          {creator.is_verified ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          {creator.is_verified ? 'Remove' : 'Verify'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && creators.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No creators found.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination('creators')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Brand Verification</CardTitle></CardHeader>
            <CardContent>
              {controls('brands', brandStatuses)}
              <Table>
                <TableHeader><TableRow><TableHead>Brand</TableHead><TableHead>Contact</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell><p className="font-medium">{brand.name}</p><p className="text-xs text-muted-foreground">{brand.user?.email}</p></TableCell>
                      <TableCell>
                        <Input value={brandContact[brand.id] ?? ''} placeholder={brand.verification_contact_email || brand.user?.email} onChange={(event) => setBrandContact((current) => ({ ...current, [brand.id]: event.target.value }))} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select value={(brand.business_verification_status || 'pending').toLowerCase()} disabled={updatingId === brand.id} onValueChange={(status) => updateBrand(brand, status)}>
                            <SelectTrigger className="w-[10rem]"><SelectValue /></SelectTrigger>
                            <SelectContent>{brandStatuses.slice(1).map((status) => <SelectItem key={status} value={status}><span className="capitalize">{status}</span></SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && brands.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No brands found.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination('brands')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambassadors" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" />Ambassador Applications</CardTitle></CardHeader>
            <CardContent>
              {controls('ambassadors', applicationStatuses)}
              <Table>
                <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Checks</TableHead><TableHead className="text-right">Decision</TableHead></TableRow></TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell><p className="font-medium">{application.creatorName || application.creatorId.slice(0, 8)}</p><p className="text-xs text-muted-foreground">{application.creatorEmail || application.id.slice(0, 8)}</p></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {[['Identity', application.identityVerified], ['Engagement', application.engagementVerified], ['Content', application.contentReviewPassed], ['Background', application.backgroundCheckPassed]].map(([label, passed]) => (
                            <Badge key={String(label)} variant={passed ? 'default' : 'secondary'}>{label}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select value={application.status?.toUpperCase() || 'UNDER_REVIEW'} disabled={updatingId === application.id} onValueChange={(status) => reviewApplication(application, status)}>
                            <SelectTrigger className="w-[10rem]"><SelectValue /></SelectTrigger>
                            <SelectContent>{['UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && applications.length === 0 && <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No ambassador applications found.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {pagination('ambassadors')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
