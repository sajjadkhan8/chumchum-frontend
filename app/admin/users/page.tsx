'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, Users, ShieldBan, ShieldAlert, ShieldCheck, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { adminService, type AdminUser } from '@/services/admin.service';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'creator' | 'brand' | 'platform_admin'>('all');
  const [active, setActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [moderateTarget, setModerateTarget] = useState<AdminUser | null>(null);
  const [moderateAction, setModerateAction] = useState<'suspend' | 'ban' | 'unban'>('suspend');
  const [moderateReason, setModerateReason] = useState('');
  const [suspendDays, setSuspendDays] = useState(30);
  const [isSubmittingModerate, setIsSubmittingModerate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'enable' | 'disable' | 'suspend' | 'ban'>('disable');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSuspendDays, setBulkSuspendDays] = useState(30);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadUsers = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers({ search, role, active, page: nextPage, limit });
      setUsers(response.users);
      setTotal(response.total);
      setPage(response.page);
    } finally {
      setIsLoading(false);
    }
  }, [active, page, role, search]);

  useEffect(() => {
    void loadUsers();
  }, []);

  const applyFilters = () => {
    void loadUsers(0);
  };

  const updateStatus = async (user: AdminUser, active: boolean) => {
    setUpdatingId(user.id);
    try {
      const updated = await adminService.updateUserStatus(user.id, active);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, active: updated.active } : item)));
      toast.success(active ? 'User re-enabled' : 'User disabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update user');
    } finally {
      setUpdatingId(null);
    }
  };

  const openModerate = (user: AdminUser, action: 'suspend' | 'ban' | 'unban') => {
    setModerateTarget(user);
    setModerateAction(action);
    setModerateReason('');
    setSuspendDays(30);
  };

  const submitModerate = async () => {
    if (!moderateTarget) return;
    setIsSubmittingModerate(true);
    try {
      const updated = await adminService.moderateUser(
        moderateTarget.id,
        moderateAction,
        moderateReason || undefined,
        moderateAction === 'suspend' ? suspendDays : undefined,
      );
      setUsers((current) => current.map((item) => (item.id === moderateTarget.id ? { ...item, active: updated.active } : item)));
      toast.success(
        moderateAction === 'ban' ? 'User banned' :
        moderateAction === 'suspend' ? `User suspended for ${suspendDays} days` :
        'User un-banned',
      );
      setModerateTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to moderate user');
    } finally {
      setIsSubmittingModerate(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      prev.size === users.length ? new Set() : new Set(users.filter((u) => u.role !== 'platform_admin').map((u) => u.id)),
    );

  const submitBulk = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmittingBulk(true);
    try {
      const { succeeded, failed } = await adminService.bulkModerateUsers(
        [...selectedIds],
        bulkAction,
        bulkReason || undefined,
        bulkSuspendDays,
      );
      setUsers((current) =>
        current.map((u) => {
          if (!succeeded.includes(u.id)) return u;
          return { ...u, active: bulkAction === 'enable' };
        }),
      );
      toast.success(`${succeeded.length} user${succeeded.length !== 1 ? 's' : ''} updated${failed.length ? ` (${failed.length} failed)` : ''}`);
      setSelectedIds(new Set());
      setBulkDialogOpen(false);
      setBulkReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk action failed');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#2d6b4e]/20 border-t-[#2d6b4e]" />
          <p className="text-sm text-[#87938b]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Users</h1>
          <p className="mt-1 text-sm text-[#496159]">{total} platform accounts</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={() => loadUsers(page)}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
        <div className="border-b border-[#f0f3f0] px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Platform</p>
          <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">User Moderation</h2>
        </div>
        <div className="p-5">
          {/* Filter row */}
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
                placeholder="Search name, email, username"
                className="border-[#d1ddd6] pl-9 focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
              />
            </div>
            <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <SelectTrigger className="w-full border-[#d1ddd6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="creator">Creators</SelectItem>
                <SelectItem value="brand">Brands</SelectItem>
                <SelectItem value="platform_admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={active} onValueChange={(value) => setActive(value as typeof active)}>
              <SelectTrigger className="w-full border-[#d1ddd6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Enabled</SelectItem>
                <SelectItem value="inactive">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              onClick={applyFilters}
              disabled={isLoading}
            >
              <Search className="h-4 w-4" />
              Apply
            </button>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#d1ddd6] bg-[#f4f7f5] px-4 py-3">
              <span className="text-sm font-bold text-[#1e3d2e]">{selectedIds.size} selected</span>
              <Select value={bulkAction} onValueChange={(v) => setBulkAction(v as typeof bulkAction)}>
                <SelectTrigger className="h-8 w-36 border-[#d1ddd6] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enable">Enable</SelectItem>
                  <SelectItem value="disable">Disable</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                </SelectContent>
              </Select>
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2d6b4e] px-3 text-xs font-bold text-white transition hover:bg-[#1f5239]"
                onClick={() => setBulkDialogOpen(true)}
              >
                <CheckSquare className="size-3.5" />
                Apply to {selectedIds.size}
              </button>
              <button
                className="ml-auto text-xs font-bold text-[#87938b] hover:text-[#1e3d2e]"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </button>
            </div>
          )}

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-[#f4f6f4]">
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    checked={selectedIds.size > 0 && selectedIds.size === users.filter((u) => u.role !== 'platform_admin').length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">User</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Role</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Joined</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-[#496159]">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-[#f4f6f4] hover:bg-[#fafcfa]">
                  <TableCell className="pr-0 w-10">
                    {user.role !== 'platform_admin' && (
                      <Checkbox
                        checked={selectedIds.has(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">
                    <div className="min-w-[14rem]">
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-[11px] text-[#87938b]">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">
                    <span className="inline-flex items-center rounded-full bg-[#e8f0ec] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#2d6b4e]">
                      {user.role.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">
                    {user.active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Enabled</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600">Disabled</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-[13px] text-[#1e3d2e]">
                    <div className="flex items-center justify-end gap-2">
                      {user.role !== 'platform_admin' && (
                        <>
                          {user.active ? (
                            <>
                              <button
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                                title="Suspend user"
                                disabled={updatingId === user.id}
                                onClick={() => openModerate(user, 'suspend')}
                              >
                                <ShieldAlert className="size-3" />
                                Suspend
                              </button>
                              <button
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-[11px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                title="Ban user"
                                disabled={updatingId === user.id}
                                onClick={() => openModerate(user, 'ban')}
                              >
                                <ShieldBan className="size-3" />
                                Ban
                              </button>
                            </>
                          ) : (
                            <button
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                              title="Remove ban/suspension"
                              disabled={updatingId === user.id}
                              onClick={() => openModerate(user, 'unban')}
                            >
                              <ShieldCheck className="size-3" />
                              Unban
                            </button>
                          )}
                        </>
                      )}
                      <Switch
                        checked={user.active}
                        disabled={updatingId === user.id || user.role === 'platform_admin'}
                        onCheckedChange={(active) => updateStatus(user, active)}
                        aria-label={`Set ${user.name} active status`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                        <Users className="size-5 text-[#2d6b4e]" />
                      </span>
                      <p className="text-sm font-extrabold text-[#1e3d2e]">No users found</p>
                      <p className="text-[11px] text-[#87938b]">Try adjusting your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f3f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[#87938b]">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isLoading || page <= 0}
                onClick={() => loadUsers(page - 1)}
              >
                Previous
              </button>
              <button
                className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isLoading || page + 1 >= totalPages}
                onClick={() => loadUsers(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk moderation dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => !open && setBulkDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1e3d2e]">
              Bulk {bulkAction} — {selectedIds.size} user{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#496159]">
              This will apply to all selected accounts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {(bulkAction === 'ban' || bulkAction === 'suspend') && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#173b2a]">
                  Reason {bulkAction === 'ban' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  className="w-full rounded-xl border border-[#d1ddd6] bg-[#fbfaf5] px-3 py-2.5 text-sm text-[#173b2a] placeholder:text-[#7c8a82] focus:border-[#185c39] focus:outline-none focus:ring-1 focus:ring-[#185c39]/20"
                  rows={3}
                  placeholder="Reason for this action…"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                />
              </div>
            )}
            {bulkAction === 'suspend' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#173b2a]">Suspension duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="w-full rounded-xl border border-[#d1ddd6] bg-[#fbfaf5] px-3 py-2.5 text-sm text-[#173b2a] focus:border-[#185c39] focus:outline-none focus:ring-1 focus:ring-[#185c39]/20"
                  value={bulkSuspendDays}
                  onChange={(e) => setBulkSuspendDays(Math.max(1, parseInt(e.target.value) || 30))}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={isSubmittingBulk || (bulkAction === 'ban' && !bulkReason.trim())}
              onClick={() => void submitBulk()}
              className={
                bulkAction === 'ban' ? 'bg-red-600 text-white hover:bg-red-700' :
                bulkAction === 'suspend' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                bulkAction === 'disable' ? 'bg-slate-600 text-white hover:bg-slate-700' :
                'bg-emerald-600 text-white hover:bg-emerald-700'
              }
            >
              {isSubmittingBulk ? 'Processing…' : `Confirm ${bulkAction.charAt(0).toUpperCase() + bulkAction.slice(1)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation dialog */}
      <Dialog open={Boolean(moderateTarget)} onOpenChange={(open) => !open && setModerateTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1e3d2e]">
              {moderateAction === 'ban' ? 'Ban user' : moderateAction === 'suspend' ? 'Suspend user' : 'Remove ban/suspension'}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#496159]">
              {moderateAction === 'unban'
                ? `Restore access for ${moderateTarget?.name}.`
                : `This will disable ${moderateTarget?.name}'s account.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {moderateAction !== 'unban' && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#173b2a]">
                    Reason {moderateAction === 'ban' ? '(required)' : '(optional)'}
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-[#d1ddd6] bg-[#fbfaf5] px-3 py-2.5 text-sm text-[#173b2a] placeholder:text-[#7c8a82] focus:border-[#185c39] focus:outline-none focus:ring-1 focus:ring-[#185c39]/20"
                    rows={3}
                    placeholder="Reason for this action…"
                    value={moderateReason}
                    onChange={(e) => setModerateReason(e.target.value)}
                  />
                </div>
                {moderateAction === 'suspend' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#173b2a]">Suspension duration (days)</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="w-full rounded-xl border border-[#d1ddd6] bg-[#fbfaf5] px-3 py-2.5 text-sm text-[#173b2a] focus:border-[#185c39] focus:outline-none focus:ring-1 focus:ring-[#185c39]/20"
                      value={suspendDays}
                      onChange={(e) => setSuspendDays(Math.max(1, parseInt(e.target.value) || 30))}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModerateTarget(null)}>Cancel</Button>
            <Button
              disabled={isSubmittingModerate || (moderateAction === 'ban' && !moderateReason.trim())}
              onClick={submitModerate}
              className={
                moderateAction === 'ban'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : moderateAction === 'suspend'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }
            >
              {isSubmittingModerate ? 'Processing…' :
               moderateAction === 'ban' ? 'Confirm Ban' :
               moderateAction === 'suspend' ? 'Confirm Suspend' :
               'Remove Restriction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
