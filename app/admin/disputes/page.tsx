'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, CircleAlert, ClipboardList, Clock3, Plus, RefreshCw, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  adminService,
  type AdminAuditLog,
  type AdminDispute,
  type DisputeResolution,
  type DisputeStatus,
} from '@/services/admin.service';

const statuses: DisputeStatus[] = ['open', 'under_review', 'waiting_for_parties', 'resolved', 'closed'];
const priorities: AdminDispute['priority'][] = ['low', 'normal', 'high', 'urgent'];
const resolutions: DisputeResolution[] = ['creator_favored', 'brand_favored', 'mutual_agreement', 'cancel_order', 'no_action'];
const auditActions = [
  'DISPUTE_CREATED',
  'DISPUTE_UPDATED',
  'DISPUTE_REFUND_REQUESTED',
  'DISPUTE_REFUND_CONFIRMED',
  'DISPUTE_REFUND_FAILED',
  'USER_STATUS_CHANGED',
  'ORDER_STATUS_CHANGED',
  'CREATOR_VERIFICATION_CHANGED',
  'CREATOR_BADGE_CHANGED',
  'BRAND_VERIFICATION_CHANGED',
  'AMBASSADOR_APPLICATION_REVIEWED',
];

const readable = (value: string) => value.replaceAll('_', ' ').toLowerCase();

export default function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState('disputes');
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [disputeTotal, setDisputeTotal] = useState(0);
  const [disputePage, setDisputePage] = useState(0);
  const [disputeSearch, setDisputeSearch] = useState('');
  const [disputeStatus, setDisputeStatus] = useState('all');
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolveDispute, setResolveDispute] = useState<AdminDispute | null>(null);
  const [refundDispute, setRefundDispute] = useState<AdminDispute | null>(null);
  const [createForm, setCreateForm] = useState({ orderId: '', title: '', description: '', priority: 'normal' });
  const [resolution, setResolution] = useState<DisputeResolution>('mutual_agreement');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const limit = 20;

  const loadDisputes = useCallback(async (page = disputePage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getDisputes({ search: disputeSearch, status: disputeStatus, page, limit });
      setDisputes(response.disputes);
      setDisputeTotal(response.total);
      setDisputePage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load disputes');
    } finally {
      setIsLoading(false);
    }
  }, [disputePage, disputeSearch, disputeStatus]);

  const loadLogs = useCallback(async (page = logPage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getAuditLogs({ search: logSearch, action: logAction, page, limit });
      setLogs(response.logs);
      setLogTotal(response.total);
      setLogPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load audit log');
    } finally {
      setIsLoading(false);
    }
  }, [logAction, logPage, logSearch]);

  useEffect(() => {
    void loadDisputes(0);
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'audit') void loadLogs(0);
  };

  const updateDispute = async (dispute: AdminDispute, input: Parameters<typeof adminService.updateDispute>[1], message: string) => {
    setUpdatingId(dispute.id);
    try {
      const updated = await adminService.updateDispute(dispute.id, input);
      setDisputes((current) => current.map((item) => (item.id === dispute.id ? updated : item)));
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update dispute');
    } finally {
      setUpdatingId(null);
    }
  };

  const createDispute = async () => {
    if (!createForm.orderId.trim() || !createForm.title.trim() || !createForm.description.trim()) {
      toast.error('Order ID, title, and description are required');
      return;
    }
    setUpdatingId('create');
    try {
      await adminService.createDispute(createForm);
      setCreateOpen(false);
      setCreateForm({ orderId: '', title: '', description: '', priority: 'normal' });
      await loadDisputes(0);
      toast.success('Dispute case opened');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open dispute');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitResolution = async () => {
    if (!resolveDispute || !resolutionNotes.trim()) {
      toast.error('Resolution notes are required');
      return;
    }
    await updateDispute(
      resolveDispute,
      { status: 'resolved', resolution, resolutionNotes },
      'Dispute resolved',
    );
    setResolveDispute(null);
    setResolutionNotes('');
  };

  const openRefund = (dispute: AdminDispute) => {
    setRefundDispute(dispute);
    setRefundAmount(String(dispute.orderAmount || ''));
    setRefundReason(dispute.resolutionNotes || '');
  };

  const executeRefund = async () => {
    if (!refundDispute || !refundReason.trim()) {
      toast.error('Refund reason is required');
      return;
    }
    const amount = Number(refundAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      toast.error('Enter a valid refund amount');
      return;
    }
    setUpdatingId(refundDispute.id);
    try {
      const updated = await adminService.executeDisputeRefund(refundDispute.id, { amount, reason: refundReason });
      setDisputes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setRefundDispute(null);
      setRefundReason('');
      toast.success('Refund submitted to mock provider');
      window.setTimeout(() => void loadDisputes(disputePage), 1800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to execute refund');
    } finally {
      setUpdatingId(null);
    }
  };

  const disputePages = Math.max(1, Math.ceil(disputeTotal / limit));
  const logPages = Math.max(1, Math.ceil(logTotal / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Disputes & Audit</h1>
          <p className="text-sm text-muted-foreground">Resolve order cases and inspect immutable admin actions.</p>
        </div>
        <Button
          variant="outline"
          className="min-h-11 gap-2"
          onClick={() => activeTab === 'audit' ? loadLogs(logPage) : loadDisputes(disputePage)}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="disputes"><ClipboardList /> Disputes</TabsTrigger>
          <TabsTrigger value="audit"><ShieldCheck /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="disputes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">{disputeTotal} dispute cases</CardTitle>
              <Button className="gap-2" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Open case</Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={disputeSearch} onChange={(event) => setDisputeSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadDisputes(0)} placeholder="Search case, order, creator, brand" className="pl-9" />
                </div>
                <Select value={disputeStatus} onValueChange={setDisputeStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => <SelectItem key={status} value={status} className="capitalize">{readable(status)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => loadDisputes(0)} disabled={isLoading}><Search className="h-4 w-4" /> Apply</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Case</TableHead><TableHead>Parties & Assignee</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead className="sticky right-0 bg-background text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell><div className="min-w-[14rem]"><p className="font-medium">{dispute.title}</p><p className="line-clamp-1 text-xs text-muted-foreground">{dispute.packageTitle} · {dispute.orderNumber || dispute.orderId}</p></div></TableCell>
                      <TableCell>
                        <div className="min-w-[10rem] text-sm">
                          <p>{dispute.creatorName} · {dispute.brandName}</p>
                          {dispute.assignedAdminName ? <p className="text-xs text-muted-foreground">Assigned to {dispute.assignedAdminName}</p> : <Button variant="outline" size="sm" className="mt-1 gap-1.5" disabled={updatingId === dispute.id} onClick={() => updateDispute(dispute, { assignToMe: true }, 'Case assigned')}><UserCheck className="h-4 w-4" /> Assign to me</Button>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={dispute.priority} disabled={updatingId === dispute.id} onValueChange={(value) => updateDispute(dispute, { priority: value as AdminDispute['priority'] }, 'Priority updated')}>
                          <SelectTrigger className="w-[7.5rem] capitalize"><SelectValue /></SelectTrigger>
                          <SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={dispute.status} disabled={updatingId === dispute.id} onValueChange={(value) => updateDispute(dispute, { status: value as DisputeStatus }, 'Status updated')}>
                          <SelectTrigger className="w-[11rem] capitalize"><SelectValue /></SelectTrigger>
                          <SelectContent>{statuses.map((status) => <SelectItem key={status} value={status} className="capitalize">{readable(status)}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-background text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                        {dispute.refundStatus === 'pending' ? (
                          <Badge variant="outline" className="gap-1.5"><Clock3 className="h-3.5 w-3.5" /> Provider pending</Badge>
                        ) : dispute.refundStatus === 'failed' ? (
                          <Badge variant="destructive" className="gap-1.5" title={dispute.refundFailureReason}><CircleAlert className="h-3.5 w-3.5" /> Refund failed</Badge>
                        ) : dispute.refundExecuted ? (
                          <Badge variant="outline" className="gap-1.5"><Banknote className="h-3.5 w-3.5" /> Refunded {formatPrice(dispute.refundAmount || 0)}</Badge>
                        ) : dispute.status === 'resolved' && ['cancel_order', 'brand_favored', 'mutual_agreement'].includes(dispute.resolution) && (dispute.orderAmount || 0) > 0 ? (
                          <Button size="sm" className="gap-1.5" onClick={() => openRefund(dispute)}><Banknote className="h-4 w-4" /> Request refund</Button>
                        ) : dispute.status === 'resolved' || dispute.status === 'closed' ? (
                          <Badge variant="outline" className="capitalize">{readable(dispute.resolution)}</Badge>
                        ) : (
                          <Button size="sm" onClick={() => setResolveDispute(dispute)}>Resolve</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && disputes.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No dispute cases found.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <Pagination page={disputePage} pages={disputePages} loading={isLoading} onPage={loadDisputes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader><CardTitle className="text-base">{logTotal} immutable admin actions</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_auto]">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={logSearch} onChange={(event) => setLogSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && loadLogs(0)} placeholder="Search admin, target, or details" className="pl-9" /></div>
                <Select value={logAction} onValueChange={setLogAction}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All actions</SelectItem>{auditActions.map((action) => <SelectItem key={action} value={action}>{readable(action)}</SelectItem>)}</SelectContent></Select>
                <Button onClick={() => loadLogs(0)} disabled={isLoading}><Search className="h-4 w-4" /> Apply</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((log) => <TableRow key={log.id}><TableCell className="whitespace-nowrap">{formatDate(new Date(log.createdAt))}</TableCell><TableCell>{log.adminName}</TableCell><TableCell><Badge variant="outline" className="capitalize">{readable(log.action)}</Badge></TableCell><TableCell><span className="capitalize">{log.targetType}</span><p className="max-w-[12rem] truncate text-xs text-muted-foreground">{log.targetId || '-'}</p></TableCell><TableCell className="max-w-[22rem] text-sm text-muted-foreground">{log.details || '-'}</TableCell></TableRow>)}
                  {!isLoading && logs.length === 0 && <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No audit entries found.</TableCell></TableRow>}
                </TableBody>
              </Table>
              <Pagination page={logPage} pages={logPages} loading={isLoading} onPage={loadLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open dispute case</DialogTitle><DialogDescription>Start a tracked moderation case for an existing order.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <Input value={createForm.orderId} onChange={(event) => setCreateForm((form) => ({ ...form, orderId: event.target.value }))} placeholder="Order UUID" />
            <Input value={createForm.title} onChange={(event) => setCreateForm((form) => ({ ...form, title: event.target.value }))} placeholder="Case title" maxLength={200} />
            <Textarea value={createForm.description} onChange={(event) => setCreateForm((form) => ({ ...form, description: event.target.value }))} placeholder="Describe the dispute and evidence" maxLength={5000} />
            <Select value={createForm.priority} onValueChange={(priority) => setCreateForm((form) => ({ ...form, priority }))}><SelectTrigger className="capitalize"><SelectValue /></SelectTrigger><SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority} className="capitalize">{priority} priority</SelectItem>)}</SelectContent></Select>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button disabled={updatingId === 'create'} onClick={createDispute}>Open case</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resolveDispute)} onOpenChange={(open) => !open && setResolveDispute(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Resolve dispute</DialogTitle><DialogDescription>Record the final decision and supporting rationale. This action is added to the audit log.</DialogDescription></DialogHeader>
          <div className="grid gap-4">
            <Select value={resolution} onValueChange={(value) => setResolution(value as DisputeResolution)}><SelectTrigger className="capitalize"><SelectValue /></SelectTrigger><SelectContent>{resolutions.map((item) => <SelectItem key={item} value={item} className="capitalize">{readable(item)}</SelectItem>)}</SelectContent></Select>
            <Textarea value={resolutionNotes} onChange={(event) => setResolutionNotes(event.target.value)} placeholder="Resolution rationale and evidence considered" maxLength={5000} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setResolveDispute(null)}>Cancel</Button><Button disabled={Boolean(updatingId)} onClick={submitResolution}>Resolve case</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(refundDispute)} onOpenChange={(open) => !open && setRefundDispute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit refund request</DialogTitle>
            <DialogDescription>
              This submits a refund to the mock provider. Order cancellation and earnings clawback happen only after the provider webhook confirms it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{refundDispute?.packageTitle}</p>
              <p className="text-muted-foreground">Order amount: {formatPrice(refundDispute?.orderAmount || 0)} · Current status: {readable(refundDispute?.orderStatus || '')}</p>
            </div>
            <Input value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} inputMode="numeric" placeholder="Refund amount" />
            <Textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} placeholder="Reason for refund execution" maxLength={500} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDispute(null)}>Cancel</Button>
            <Button variant="destructive" disabled={Boolean(updatingId)} onClick={executeRefund}>Submit to provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pagination({ page, pages, loading, onPage }: { page: number; pages: number; loading: boolean; onPage: (page: number) => void | Promise<void> }) {
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">Page {page + 1} of {pages}</p>
      <div className="flex gap-2"><Button variant="outline" disabled={loading || page <= 0} onClick={() => onPage(page - 1)}>Previous</Button><Button variant="outline" disabled={loading || page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</Button></div>
    </div>
  );
}
