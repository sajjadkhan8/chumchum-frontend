'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Search, ShieldCheck, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminService, type AdminAuditLog, type AdminUser } from '@/services/admin.service';
import { formatDate } from '@/lib/utils';

const auditModerationActions = [
  'USER_STATUS_CHANGED',
  'CREATOR_VERIFICATION_CHANGED',
  'CREATOR_BADGE_CHANGED',
  'BRAND_VERIFICATION_CHANGED',
];

const readable = (value: string) => value.replaceAll('_', ' ').toLowerCase();

function Pagination({ page, pages, loading, onPage }: { page: number; pages: number; loading: boolean; onPage: (p: number) => void }) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f3f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[12px] text-[#87938b]">Page {page + 1} of {pages}</p>
      <div className="flex gap-2">
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={loading || page <= 0}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={loading || page + 1 >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminUserModerationPage() {
  const [activeTab, setActiveTab] = useState('queue');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState<'all' | 'creator' | 'brand' | 'platform_admin'>('all');
  const [userActive, setUserActive] = useState<'all' | 'active' | 'inactive'>('inactive');

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const limit = 20;
  const userPages = useMemo(() => Math.max(1, Math.ceil(userTotal / limit)), [userTotal]);
  const logPages = useMemo(() => Math.max(1, Math.ceil(logTotal / limit)), [logTotal]);

  const loadUsers = useCallback(async (page = userPage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers({ search: userSearch, role: userRole, active: userActive, page, limit });
      setUsers(response.users);
      setUserTotal(response.total);
      setUserPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  }, [userActive, userPage, userRole, userSearch]);

  const loadLogs = useCallback(async (page = logPage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getAuditLogs({ search: logSearch, action: logAction, page, limit });
      setLogs(response.logs);
      setLogTotal(response.total);
      setLogPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load moderation log');
    } finally {
      setIsLoading(false);
    }
  }, [logAction, logPage, logSearch]);

  useEffect(() => {
    void loadUsers(0);
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'log') void loadLogs(0);
    else void loadUsers(0);
  };

  const updateStatus = async (user: AdminUser, active: boolean) => {
    setUpdatingId(user.id);
    try {
      const updated = await adminService.updateUserStatus(user.id, active);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, active: updated.active } : item)));
      toast.success(active ? 'Account re-enabled' : 'Account disabled');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update account status');
    } finally {
      setUpdatingId(null);
    }
  };

  const refresh = () => {
    if (activeTab === 'log') void loadLogs(logPage);
    else void loadUsers(userPage);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">User Moderation</h1>
          <p className="mt-1 text-sm text-[#496159]">Review flagged accounts, take moderation actions, and audit history.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="gap-1 rounded-xl border border-[#e2e7e1] bg-[#f9faf8] p-1">
          <TabsTrigger
            value="queue"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <AlertTriangle className="h-4 w-4" /> Moderation queue
          </TabsTrigger>
          <TabsTrigger
            value="log"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="h-4 w-4" /> Moderation log
          </TabsTrigger>
        </TabsList>

        {/* Queue tab */}
        <TabsContent value="queue" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Accounts</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{userTotal} matching filters</h2>
              </div>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers(0)}
                    placeholder="Search name or email"
                    className="border-[#d1ddd6] pl-9"
                  />
                </div>
                <Select value={userRole} onValueChange={(v) => setUserRole(v as typeof userRole)}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="creator">Creators</SelectItem>
                    <SelectItem value="brand">Brands</SelectItem>
                    <SelectItem value="platform_admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userActive} onValueChange={(v) => setUserActive(v as typeof userActive)}>
                  <SelectTrigger className="border-[#d1ddd6]">
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
                  onClick={() => loadUsers(0)}
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" /> Apply
                </button>
              </div>

              {/* Table */}
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Account</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Role</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Joined</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                    <TableHead className="sticky right-0 bg-white text-right text-[11px] font-bold uppercase tracking-wide text-[#496159] shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell>
                        <div className="min-w-[14rem]">
                          <p className="text-[13px] font-semibold text-[#1e3d2e]">{user.name}</p>
                          <p className="text-[11px] text-[#87938b]">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-[#e8f0ec] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#2d6b4e]">
                          {user.role.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px] font-semibold text-[#1e3d2e]">{formatDate(user.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {user.active ? 'Enabled' : 'Disabled'}
                        </span>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.35)]">
                        {user.role === 'platform_admin' ? (
                          <span className="text-[11px] text-[#87938b]">Protected</span>
                        ) : user.active ? (
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-red-500 px-3 text-[11px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                            disabled={updatingId === user.id}
                            onClick={() => updateStatus(user, false)}
                          >
                            <UserMinus className="h-3.5 w-3.5" /> Disable
                          </button>
                        ) : (
                          <button
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-[#d1ddd6] px-3 text-[11px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
                            disabled={updatingId === user.id}
                            onClick={() => updateStatus(user, true)}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Re-enable
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <AlertTriangle className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">Nothing found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>

              <Pagination page={userPage} pages={userPages} loading={isLoading} onPage={loadUsers} />
            </div>
          </div>
        </TabsContent>

        {/* Log tab */}
        <TabsContent value="log" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Audit Log</p>
                <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{logTotal} moderation actions recorded</h2>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0ec]">
                <ShieldCheck className="size-4 text-[#2d6b4e]" />
              </span>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadLogs(0)}
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
                    {auditModerationActions.map((a) => (
                      <SelectItem key={a} value={a}>{readable(a)}</SelectItem>
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

              {/* Table */}
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
                      <TableCell className="whitespace-nowrap">
                        <p className="text-[13px] font-semibold text-[#1e3d2e]">{formatDate(new Date(log.createdAt))}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px] font-semibold text-[#1e3d2e]">{log.adminName}</p>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#496159]">
                          {readable(log.action)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-[13px] font-semibold capitalize text-[#1e3d2e]">{log.targetType}</p>
                        <p className="max-w-[12rem] truncate text-[11px] text-[#87938b]">{log.targetId || '-'}</p>
                      </TableCell>
                      <TableCell className="max-w-[22rem]">
                        <p className="text-[11px] text-[#87938b]">{log.details || '-'}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <ShieldCheck className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">Nothing found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>

              <Pagination page={logPage} pages={logPages} loading={isLoading} onPage={loadLogs} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
