'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, Banknote, Clock3, RefreshCw, Search, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatorMetricCard } from '@/components/creator-metric-card';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  adminService,
  type AdminPaymentsStats,
  type AdminTransaction,
  type AdminWithdrawal,
  type WithdrawalStatus,
} from '@/services/admin.service';

const transactionTypes = ['order_payment', 'earning', 'affiliate_commission', 'withdrawal', 'refund', 'platform_fee'];
const transactionStatuses = ['pending', 'completed', 'failed'];
const withdrawalStatuses: WithdrawalStatus[] = ['pending', 'processing', 'completed', 'failed'];

const readable = (value: string) => value.replaceAll('_', ' ').toLowerCase();

const txStatusCls = (s: string) => {
  if (s === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (s === 'failed') return 'bg-red-50 text-red-600';
  return 'bg-[#f9faf8] text-[#496159] border border-[#e2e7e1]';
};

const wdStatusCls = (s: string) => {
  if (s === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (s === 'failed') return 'bg-red-50 text-red-600';
  if (s === 'processing') return 'bg-blue-50 text-blue-700';
  return 'bg-[#f9faf8] text-[#496159] border border-[#e2e7e1]';
};

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

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [stats, setStats] = useState<AdminPaymentsStats | null>(null);

  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('all');
  const [txStatus, setTxStatus] = useState('all');

  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [wdTotal, setWdTotal] = useState(0);
  const [wdPage, setWdPage] = useState(0);
  const [wdSearch, setWdSearch] = useState('');
  const [wdStatus, setWdStatus] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const limit = 20;
  const txPages = useMemo(() => Math.max(1, Math.ceil(txTotal / limit)), [txTotal]);
  const wdPages = useMemo(() => Math.max(1, Math.ceil(wdTotal / limit)), [wdTotal]);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getPaymentsStats();
      setStats(data);
    } catch {
      // stats are non-critical; silently skip
    }
  }, []);

  const loadTransactions = useCallback(async (page = txPage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getTransactions({ search: txSearch, type: txType, status: txStatus, page, limit });
      setTransactions(response.transactions);
      setTxTotal(response.total);
      setTxPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [txPage, txSearch, txStatus, txType]);

  const loadWithdrawals = useCallback(async (page = wdPage) => {
    setIsLoading(true);
    try {
      const response = await adminService.getWithdrawals({ search: wdSearch, status: wdStatus, page, limit });
      setWithdrawals(response.withdrawals);
      setWdTotal(response.total);
      setWdPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load withdrawals');
    } finally {
      setIsLoading(false);
    }
  }, [wdPage, wdSearch, wdStatus]);

  useEffect(() => {
    void loadStats();
    void loadTransactions(0);
  }, []);

  const changeTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'withdrawals') void loadWithdrawals(0);
    else void loadTransactions(0);
  };

  const processWithdrawal = async (withdrawal: AdminWithdrawal, status: string) => {
    setUpdatingId(withdrawal.id);
    try {
      const updated = await adminService.processWithdrawal(withdrawal.id, status);
      setWithdrawals((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      void loadStats();
      toast.success(`Withdrawal marked as ${readable(status)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update withdrawal');
    } finally {
      setUpdatingId(null);
    }
  };

  const refresh = () => {
    void loadStats();
    if (activeTab === 'withdrawals') void loadWithdrawals(wdPage);
    else void loadTransactions(txPage);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Payments</h1>
          <p className="mt-1 text-sm text-[#496159]">Operational view — transactions, payouts, and escrow activity.</p>
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

      {/* Stats */}
      {stats && (
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Payment metrics">
          <CreatorMetricCard
            title="Total Transactions"
            animatedValue={stats.totalTransactions}
            sub={`${stats.pendingTransactions} pending`}
            Icon={Banknote}
            spark={[5, 8, 6, 10, 9, 12, 11, 14, 13, 15, 14, 16]}
            trend={4}
          />
          <CreatorMetricCard
            dark
            title="Creator Earnings"
            animatedValue={stats.totalEarnings}
            fmt={(n) => n >= 1000 ? `Rs ${(n / 1000).toFixed(0)}k` : `Rs ${n}`}
            sub="total paid out"
            Icon={TrendingUp}
            spark={[10, 15, 12, 20, 18, 25, 22, 28, 26, 30]}
            trend={9}
          />
          <CreatorMetricCard
            title="Pending Withdrawals"
            animatedValue={stats.pendingWithdrawals}
            sub={stats.pendingWithdrawals > 0 ? formatPrice(stats.pendingWithdrawalsAmount) : 'none pending'}
            Icon={Clock3}
            spark={[2, 4, 3, 5, 4, 6, 5, 7, 6, 5]}
            trend={-2}
          />
          <CreatorMetricCard
            title="Completed Payouts"
            animatedValue={stats.completedWithdrawals}
            sub={formatPrice(stats.completedWithdrawalsAmount)}
            Icon={Wallet}
            spark={[3, 5, 4, 7, 6, 9, 8, 11, 10, 12]}
            trend={7}
          />
        </section>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList className="gap-1 rounded-xl border border-[#e2e7e1] bg-[#f9faf8] p-1">
          <TabsTrigger
            value="transactions"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Banknote className="h-4 w-4" /> Transactions
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="gap-2 rounded-lg px-4 py-2 text-[12px] font-bold text-[#496159] data-[state=active]:bg-[#2d6b4e] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ArrowDownToLine className="h-4 w-4" /> Withdrawals
          </TabsTrigger>
        </TabsList>

        {/* Transactions tab */}
        <TabsContent value="transactions" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Transactions</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{txTotal} records</h2>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_13rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadTransactions(0)}
                    placeholder="Search creator or description"
                    className="border-[#d1ddd6] pl-9"
                  />
                </div>
                <Select value={txType} onValueChange={setTxType}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {transactionTypes.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{readable(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={txStatus} onValueChange={setTxStatus}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {transactionStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                  onClick={() => loadTransactions(0)}
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" /> Apply
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Time</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Creator</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Type</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Amount</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell className="whitespace-nowrap text-[13px] text-[#496159]">{formatDate(new Date(tx.createdAt))}</TableCell>
                      <TableCell className="text-[13px] font-medium text-[#1e3d2e]">{tx.creatorName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#496159]">
                          {readable(tx.type)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-[13px] font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-[#1e3d2e]'}`}>
                        {tx.amount < 0 ? `−${formatPrice(Math.abs(tx.amount))}` : formatPrice(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${txStatusCls(tx.status)}`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[20rem] text-[12px] text-[#87938b]">{tx.description}</TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <Banknote className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">No transactions found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your search or filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination page={txPage} pages={txPages} loading={isLoading} onPage={loadTransactions} />
            </div>
          </div>
        </TabsContent>

        {/* Withdrawals tab */}
        <TabsContent value="withdrawals" className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
            <div className="border-b border-[#f0f3f0] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Withdrawals</p>
              <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{wdTotal} records</h2>
            </div>
            <div className="p-5">
              {/* Filter row */}
              <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
                  <Input
                    value={wdSearch}
                    onChange={(e) => setWdSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadWithdrawals(0)}
                    placeholder="Search creator name"
                    className="border-[#d1ddd6] pl-9"
                  />
                </div>
                <Select value={wdStatus} onValueChange={setWdStatus}>
                  <SelectTrigger className="border-[#d1ddd6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {withdrawalStatuses.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                  onClick={() => loadWithdrawals(0)}
                  disabled={isLoading}
                >
                  <Search className="h-4 w-4" /> Apply
                </button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-[#f4f6f4]">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Requested</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Creator</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Payout method</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Amount</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
                    <TableHead className="sticky right-0 bg-white text-right text-[11px] font-bold uppercase tracking-wide text-[#496159] shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.1)]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((wd) => (
                    <TableRow key={wd.id} className="border-[#f4f6f4] transition-colors hover:bg-[#fafcfa]">
                      <TableCell className="whitespace-nowrap text-[13px] text-[#496159]">{formatDate(new Date(wd.createdAt))}</TableCell>
                      <TableCell className="text-[13px] font-medium text-[#1e3d2e]">{wd.creatorName}</TableCell>
                      <TableCell>
                        <p className="text-[13px] text-[#1e3d2e]">{wd.payoutMethodName}</p>
                        <p className="text-[11px] capitalize text-[#87938b]">{readable(wd.payoutMethodType)}</p>
                      </TableCell>
                      <TableCell className="text-[13px] font-semibold text-[#1e3d2e]">{formatPrice(wd.amount)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${wdStatusCls(wd.status)}`}>
                          {wd.status}
                        </span>
                      </TableCell>
                      <TableCell className="sticky right-0 bg-white text-right shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.1)]">
                        {wd.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              className="inline-flex h-8 items-center rounded-xl border border-[#d1ddd6] px-3 text-[11px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
                              disabled={updatingId === wd.id}
                              onClick={() => processWithdrawal(wd, 'processing')}
                            >
                              Mark processing
                            </button>
                            <button
                              className="inline-flex h-8 items-center rounded-xl bg-red-500 px-3 text-[11px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                              disabled={updatingId === wd.id}
                              onClick={() => processWithdrawal(wd, 'failed')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : wd.status === 'processing' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              className="inline-flex h-8 items-center rounded-xl bg-[#2d6b4e] px-3 text-[11px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
                              disabled={updatingId === wd.id}
                              onClick={() => processWithdrawal(wd, 'completed')}
                            >
                              Mark complete
                            </button>
                            <button
                              className="inline-flex h-8 items-center rounded-xl bg-red-500 px-3 text-[11px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                              disabled={updatingId === wd.id}
                              onClick={() => processWithdrawal(wd, 'failed')}
                            >
                              Fail
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] capitalize text-[#87938b]">
                            {wd.processedAt ? formatDate(new Date(wd.processedAt)) : wd.status}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && withdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0ec]">
                            <ArrowDownToLine className="size-4 text-[#2d6b4e]" />
                          </span>
                          <p className="text-[13px] font-bold text-[#1e3d2e]">No withdrawal requests found</p>
                          <p className="text-[11px] text-[#87938b]">Try adjusting your search or filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination page={wdPage} pages={wdPages} loading={isLoading} onPage={loadWithdrawals} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
