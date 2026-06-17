'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, CircleAlert, ClipboardList, Clock3, Plus, RefreshCw, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
      toast.success('Refund submitted to provider');
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
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Disputes</h1>
          <p className="mt-1 text-sm text-[#496159]">Resolve order cases and inspect immutable admin actions.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={() => activeTab === 'audit' ? loadLogs(logPage) : loadDisputes(disputePage)}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="gap-1 rounded-xl border border-[#e2e7e1] bg-[#f9faf8] p-1">
          <TabsTrigger
            value="disputes"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ClipboardList className="h-4 w-4" /> Disputes
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Disputes tab */}
        <TabsContent value="disputes">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Case management</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{disputeTotal} dispute cases</h2>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#2d6b4e] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#1f5239]"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" /> Open case
              </button>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={disputeSearch}
                    onChange={(event) => setDisputeSearch(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && loadDisputes(0)}
                    placeholder="Search case, order, creator, brand"
                    className="border-[#d1ddd6] pl-9"
                  />
                </div>
                <Select value={disputeStatus} onValueChange={setDisputeStatus}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status} className="capitalize">{readable(status)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                  onClick={() => loadDisputes(0)}
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" /> Apply
                </button>
              </div>

              {/* Disputes table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Case</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Parties &amp; Assignee</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Priority</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                    <TableHead className="sticky right-0 bg-white text-right text-[11px] font-bold uppercase tracking-wide text-[#496159] shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.1)]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell>
                        <div className="min-w-[14rem]">
                          <p className="font-semibold text-[#1e3d2e]">{dispute.title}</p>
                          <p className="line-clamp-1 text-xs text-[#87938b]">{dispute.packageTitle} · {dispute.orderNumber || dispute.orderId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[10rem] text-sm">
                          <p className="text-[#1e3d2e]">{dispute.creatorName} · {dispute.brandName}</p>
                          {dispute.assignedAdminName ? (
                            <p className="text-xs text-[#87938b]">Assigned to {dispute.assignedAdminName}</p>
                          ) : (
                            <button
                              className="mt-1 inline-flex h-7 items-center gap-1.5 rounded-xl border border-[#d1ddd6] px-2.5 text-[11px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
                              disabled={updatingId === dispute.id}
                              onClick={() => updateDispute(dispute, { assignToMe: true }, 'Case assigned')}
                            >
                              <UserCheck className="h-3.5 w-3.5" /> Assign to me
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dispute.priority}
                          disabled={updatingId === dispute.id}
                          onValueChange={(value) => updateDispute(dispute, { priority: value as AdminDispute['priority'] }, 'Priority updated')}
                        >
                          <SelectTrigger className="w-[7.5rem] border-[#d1ddd6] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorities.map((priority) => (
                              <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={dispute.status}
                          disabled={updatingId === dispute.id}
                          onValueChange={(value) => updateDispute(dispute, { status: value as DisputeStatus }, 'Status updated')}
                        >
                          <SelectTrigger className="w-[11rem] border-[#d1ddd6] capitalize">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status} className="capitalize">{readable(status)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.1)]">
                        {dispute.refundStatus === 'pending' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold text-[#496159]">
                            <Clock3 className="h-3 w-3" /> Provider pending
                          </span>
                        ) : dispute.refundStatus === 'failed' ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-600"
                            title={dispute.refundFailureReason}
                          >
                            <CircleAlert className="h-3 w-3" /> Refund failed
                          </span>
                        ) : dispute.refundExecuted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <Banknote className="h-3 w-3" /> Refunded {formatPrice(dispute.refundAmount || 0)}
                          </span>
                        ) : dispute.status === 'resolved' && ['cancel_order', 'brand_favored', 'mutual_agreement'].includes(dispute.resolution) && (dispute.orderAmount || 0) > 0 ? (
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-[#2d6b4e] px-3 text-[11px] font-bold text-white transition hover:bg-[#1f5239]"
                            onClick={() => openRefund(dispute)}
                          >
                            <Banknote className="h-3.5 w-3.5" /> Request refund
                          </button>
                        ) : dispute.status === 'resolved' || dispute.status === 'closed' ? (
                          <span className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#496159]">
                            {readable(dispute.resolution)}
                          </span>
                        ) : (
                          <button
                            className="inline-flex h-8 items-center rounded-xl bg-[#2d6b4e] px-3 text-[11px] font-bold text-white transition hover:bg-[#1f5239]"
                            onClick={() => setResolveDispute(dispute)}
                          >
                            Resolve
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && disputes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-[#87938b]">No dispute cases found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Pagination page={disputePage} pages={disputePages} loading={isLoading} onPage={loadDisputes} />
            </div>
          </div>
        </TabsContent>

        {/* Audit log tab */}
        <TabsContent value="audit">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Immutable record</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{logTotal} admin actions</h2>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={logSearch}
                    onChange={(event) => setLogSearch(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && loadLogs(0)}
                    placeholder="Search admin, target, or details"
                    className="border-[#d1ddd6] pl-9"
                  />
                </div>
                <Select value={logAction} onValueChange={setLogAction}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {auditActions.map((action) => (
                      <SelectItem key={action} value={action}>{readable(action)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                  onClick={() => loadLogs(0)}
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" /> Apply
                </button>
              </div>

              {/* Audit table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Time</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Admin</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Action</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Target</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell className="whitespace-nowrap text-sm text-[#496159]">{formatDate(new Date(log.createdAt))}</TableCell>
                      <TableCell className="text-sm font-medium text-[#1e3d2e]">{log.adminName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#496159]">
                          {readable(log.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize text-[#1e3d2e]">{log.targetType}</span>
                        <p className="max-w-[12rem] truncate text-xs text-[#87938b]">{log.targetId || '-'}</p>
                      </TableCell>
                      <TableCell className="max-w-[22rem] text-sm text-[#87938b]">{log.details || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-[#87938b]">No audit entries found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Pagination page={logPage} pages={logPages} loading={isLoading} onPage={loadLogs} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create dispute dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1e3d2e]">Open dispute case</DialogTitle>
            <DialogDescription className="text-[#496159]">Start a tracked moderation case for an existing order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={createForm.orderId}
              onChange={(event) => setCreateForm((form) => ({ ...form, orderId: event.target.value }))}
              placeholder="Order UUID"
              className="border-[#d1ddd6]"
            />
            <Input
              value={createForm.title}
              onChange={(event) => setCreateForm((form) => ({ ...form, title: event.target.value }))}
              placeholder="Case title"
              maxLength={200}
              className="border-[#d1ddd6]"
            />
            <Textarea
              value={createForm.description}
              onChange={(event) => setCreateForm((form) => ({ ...form, description: event.target.value }))}
              placeholder="Describe the dispute and evidence"
              maxLength={5000}
              className="border-[#d1ddd6]"
            />
            <Select value={createForm.priority} onValueChange={(priority) => setCreateForm((form) => ({ ...form, priority }))}>
              <SelectTrigger className="border-[#d1ddd6] capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority} className="capitalize">{priority} priority</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <button
              className="inline-flex h-10 items-center rounded-xl border border-[#d1ddd6] px-4 text-[13px] font-bold text-[#496159] transition hover:bg-[#f9faf8]"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center rounded-xl bg-[#2d6b4e] px-4 text-[13px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              disabled={updatingId === 'create'}
              onClick={createDispute}
            >
              Open case
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dispute dialog */}
      <Dialog open={Boolean(resolveDispute)} onOpenChange={(open) => !open && setResolveDispute(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1e3d2e]">Resolve dispute</DialogTitle>
            <DialogDescription className="text-[#496159]">Record the final decision. This action is added to the audit log.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Select value={resolution} onValueChange={(value) => setResolution(value as DisputeResolution)}>
              <SelectTrigger className="border-[#d1ddd6] capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resolutions.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">{readable(item)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              placeholder="Resolution rationale and evidence considered"
              maxLength={5000}
              className="border-[#d1ddd6]"
            />
          </div>
          <DialogFooter>
            <button
              className="inline-flex h-10 items-center rounded-xl border border-[#d1ddd6] px-4 text-[13px] font-bold text-[#496159] transition hover:bg-[#f9faf8]"
              onClick={() => setResolveDispute(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center rounded-xl bg-[#2d6b4e] px-4 text-[13px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              disabled={Boolean(updatingId)}
              onClick={submitResolution}
            >
              Resolve case
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund dialog */}
      <Dialog open={Boolean(refundDispute)} onOpenChange={(open) => !open && setRefundDispute(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1e3d2e]">Submit refund request</DialogTitle>
            <DialogDescription className="text-[#496159]">
              This submits a refund to the configured provider. Order cancellation happens only after the provider webhook confirms it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="rounded-xl border border-[#edf1ed] bg-[#fbfaf5] p-3.5">
              <p className="text-[13px] font-semibold text-[#1e3d2e]">{refundDispute?.packageTitle}</p>
              <p className="mt-0.5 text-[11px] text-[#87938b]">
                Order amount: {formatPrice(refundDispute?.orderAmount || 0)} · Status: {readable(refundDispute?.orderStatus || '')}
              </p>
            </div>
            <Input
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              inputMode="numeric"
              placeholder="Refund amount"
              className="border-[#d1ddd6]"
            />
            <Textarea
              value={refundReason}
              onChange={(event) => setRefundReason(event.target.value)}
              placeholder="Reason for refund execution"
              maxLength={500}
              className="border-[#d1ddd6]"
            />
          </div>
          <DialogFooter>
            <button
              className="inline-flex h-10 items-center rounded-xl border border-[#d1ddd6] px-4 text-[13px] font-bold text-[#496159] transition hover:bg-[#f9faf8]"
              onClick={() => setRefundDispute(null)}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center rounded-xl bg-red-500 px-4 text-[13px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              disabled={Boolean(updatingId)}
              onClick={executeRefund}
            >
              Submit to provider
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pagination({ page, pages, loading, onPage }: { page: number; pages: number; loading: boolean; onPage: (page: number) => void | Promise<void> }) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f3f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-[#87938b]">Page {page + 1} of {pages}</p>
      <div className="flex gap-2">
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={loading || page <= 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={loading || page + 1 >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
