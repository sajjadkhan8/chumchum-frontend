'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { adminService, type AdminPaymentAuditLog } from '@/services/admin.service';

const paymentActions = [
  'CREATOR_PAYOUT_PREFERENCES_UPDATED',
  'CREATOR_PAYOUT_METHOD_CREATED',
  'CREATOR_PAYOUT_METHOD_UPDATED',
  'CREATOR_PAYOUT_METHOD_DELETED',
  'CREATOR_WITHDRAWAL_REQUESTED',
  'BRAND_PAYMENT_METHOD_CREATED',
  'BRAND_PAYMENT_METHOD_UPDATED',
  'BRAND_PAYMENT_METHOD_DELETED',
  'BRAND_PAYOUT_CONTROLS_UPDATED',
  'BRAND_WALLET_TOPUP',
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

export default function AdminPaymentsAuditPage() {
  const [logs, setLogs] = useState<AdminPaymentAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [brandId, setBrandId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const limit = 20;

  const load = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    try {
      const response = await adminService.getPaymentAuditLogs({
        search,
        action,
        brandId: brandId.trim() || undefined,
        page: nextPage,
        limit,
      });
      setLogs(response.logs);
      setTotal(response.total);
      setPage(response.page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load payment audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [action, brandId, search]);

  useEffect(() => {
    void load(0);
  }, [load]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Payments Audit</h1>
          <p className="mt-1 text-sm text-[#496159]">Inspect immutable payment operations across creators and brands.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={() => load(page)}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </button>
      </div>

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-[#e2e7e1] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f0f3f0] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b77a12]">Payment Operations</p>
            <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">{total} audit entries</h2>
          </div>
          <span className="grid size-9 place-items-center rounded-xl bg-[#e8f0ec]">
            <ShieldCheck className="size-4 text-[#2d6b4e]" />
          </span>
        </div>

        <div className="p-5">
          {/* Filter row */}
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && load(0)}
                placeholder="Search actor, action, target, details"
                className="border-[#d1ddd6] pl-9"
              />
            </div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="border-[#d1ddd6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {paymentActions.map((item) => (
                  <SelectItem key={item} value={item}>{readable(item)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              placeholder="Filter by brand UUID"
              className="border-[#d1ddd6]"
            />
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2d6b4e] px-4 text-[12px] font-bold text-white transition hover:bg-[#1f5239] disabled:opacity-50"
              onClick={() => load(0)}
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
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Actor</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Brand</TableHead>
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
                    <p className="text-[13px] font-semibold text-[#1e3d2e]">{log.actorName}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-[13px] font-semibold text-[#1e3d2e]">{log.brandName || '-'}</p>
                    <p className="max-w-[11rem] truncate text-[11px] text-[#87938b]">{log.brandId || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border border-[#e2e7e1] bg-[#f9faf8] px-2.5 py-0.5 text-[10px] font-bold capitalize text-[#496159]">
                      {readable(log.action)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="text-[13px] font-semibold capitalize text-[#1e3d2e]">{log.targetType}</p>
                    <p className="max-w-[11rem] truncate text-[11px] text-[#87938b]">{log.targetId || '-'}</p>
                  </TableCell>
                  <TableCell className="max-w-[22rem]">
                    <p className="text-[11px] text-[#87938b]">{log.details || '-'}</p>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
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

          <Pagination page={page} pages={pages} loading={isLoading} onPage={load} />
        </div>
      </div>
    </div>
  );
}
