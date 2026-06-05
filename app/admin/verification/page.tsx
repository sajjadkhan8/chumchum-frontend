'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService, type AdminUser, type AmbassadorApplication } from '@/services/admin.service';

const brandStatuses = ['Pending', 'Under Review', 'Verified', 'Rejected'];
const applicationStatuses = ['UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export default function AdminVerificationPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [applications, setApplications] = useState<AmbassadorApplication[]>([]);
  const [brandContact, setBrandContact] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const creators = useMemo(() => users.filter((user) => user.role === 'creator'), [users]);
  const brands = useMemo(() => users.filter((user) => user.role === 'brand'), [users]);

  const loadVerification = async () => {
    setIsLoading(true);
    try {
      const [userResponse, applicationResponse] = await Promise.all([
        adminService.getUsers({ page: 0, limit: 100 }),
        adminService.getAmbassadorApplications(undefined, 0, 50),
      ]);
      setUsers(userResponse.users);
      setApplications(applicationResponse.applications);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVerification();
  }, []);

  const updateCreator = async (creator: AdminUser, verified: boolean) => {
    setUpdatingId(creator.id);
    try {
      await adminService.updateCreatorVerification(creator.id, verified);
      setUsers((current) =>
        current.map((item) => (item.id === creator.id ? { ...item, creator: { ...item.creator, isVerified: verified, is_verified: verified } } : item)),
      );
      toast.success(verified ? 'Creator verified' : 'Creator verification removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update creator');
    } finally {
      setUpdatingId(null);
    }
  };

  const updateBrand = async (brand: AdminUser, status: string) => {
    setUpdatingId(brand.id);
    try {
      await adminService.updateBrandVerification(brand.id, status, brandContact[brand.id] || brand.email);
      setUsers((current) =>
        current.map((item) =>
          item.id === brand.id ? { ...item, brand: { ...item.brand, businessVerificationStatus: status, business_verification_status: status } } : item,
        ),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Verification</h1>
          <p className="text-sm text-muted-foreground">Creator, brand, and ambassador trust operations.</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={loadVerification} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="creators">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="ambassadors">Ambassadors</TabsTrigger>
        </TabsList>

        <TabsContent value="creators" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Creator Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Creator</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creators.map((creator) => {
                    const verified = Boolean(creator.creator?.isVerified ?? creator.creator?.is_verified);
                    return (
                      <TableRow key={creator.id}>
                        <TableCell>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-xs text-muted-foreground">{creator.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={verified ? 'default' : 'secondary'}>{verified ? 'Verified' : 'Unverified'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={verified ? 'outline' : 'default'}
                            size="sm"
                            className="gap-2"
                            disabled={updatingId === creator.id}
                            onClick={() => updateCreator(creator, !verified)}
                          >
                            {verified ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {verified ? 'Remove' : 'Verify'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-xs text-muted-foreground">{brand.email}</p>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={brandContact[brand.id] ?? ''}
                          placeholder={brand.email}
                          onChange={(event) => setBrandContact((current) => ({ ...current, [brand.id]: event.target.value }))}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select
                            value={brand.brand?.businessVerificationStatus || brand.brand?.business_verification_status || 'Pending'}
                            disabled={updatingId === brand.id}
                            onValueChange={(status) => updateBrand(brand, status)}
                          >
                            <SelectTrigger className="w-[10rem]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {brandStatuses.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ambassadors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Ambassador Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Checks</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <p className="font-medium">{application.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">Creator {application.creatorId.slice(0, 8)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            ['Identity', application.identityVerified],
                            ['Engagement', application.engagementVerified],
                            ['Content', application.contentReviewPassed],
                            ['Background', application.backgroundCheckPassed],
                          ].map(([label, passed]) => (
                            <Badge key={String(label)} variant={passed ? 'default' : 'secondary'}>
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <Select
                            value={application.status?.toUpperCase() || 'UNDER_REVIEW'}
                            disabled={updatingId === application.id}
                            onValueChange={(status) => reviewApplication(application, status)}
                          >
                            <SelectTrigger className="w-[10rem]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {applicationStatuses.map((status) => (
                                <SelectItem key={status} value={status}>{status.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No ambassador applications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
