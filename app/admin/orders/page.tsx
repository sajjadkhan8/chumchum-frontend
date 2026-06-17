'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminService, type AdminOrder } from '@/services/admin.service';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const orderStatuses: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'delivered', 'review', 'revision', 'completed', 'cancelled'];

function StatusChip({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    completed:   { label: 'Completed',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    in_progress: { label: 'In Progress', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
    delivered:   { label: 'Delivered',   cls: 'bg-violet-50 text-violet-700 border-violet-200' },
    review:      { label: 'In Review',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    revision:    { label: 'Revision',    cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    pending:     { label: 'Pending',     cls: 'bg-slate-50 text-slate-600 border-slate-200' },
    accepted:    { label: 'Accepted',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    cancelled:   { label: 'Cancelled',   cls: 'bg-red-50 text-red-600 border-red-200' },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadOrders = useCallback(async (nextPage = page) => {
    setIsLoading(true);
    try {
      const response = await adminService.getOrders({ search, status, page: nextPage, limit });
      setOrders(response.orders);
      setTotal(response.total);
      setPage(response.page);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadOrders();
  }, []);

  const applyFilters = () => {
    void loadOrders(0);
  };

  const updateStatus = async (order: AdminOrder, status: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      const updated = await adminService.updateOrderStatus(order.id, status);
      setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: updated.status, progress: updated.progress } : item)));
      toast.success('Order status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading && orders.length === 0) {
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
          <h1 className="text-2xl font-extrabold text-[#1e3d2e] md:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-[#496159]">{total} creator-brand orders</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-[#d1ddd6] bg-white px-4 py-2.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:opacity-50"
          onClick={() => loadOrders(page)}
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
          <h2 className="mt-0.5 text-[15px] font-extrabold text-[#1e3d2e]">Order Oversight</h2>
        </div>
        <div className="p-5">
          {/* Filter row */}
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87938b]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
                placeholder="Search package, creator, brand"
                className="border-[#d1ddd6] pl-9 focus:border-[#2d6b4e] focus:ring-[#2d6b4e]/20"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full border-[#d1ddd6]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {orderStatuses.map((item) => (
                  <SelectItem key={item} value={item}>
                    <span className="capitalize">{item.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
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

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-[#f4f6f4]">
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Package</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Creator</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Brand</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Amount</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wide text-[#496159]">Created</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase tracking-wide text-[#496159]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-[#f4f6f4] hover:bg-[#fafcfa]">
                  <TableCell className="text-[13px] text-[#1e3d2e]">
                    <div className="min-w-[13rem]">
                      <p className="font-semibold">{order.packageTitle}</p>
                      <p className="text-[11px] capitalize text-[#87938b]">{order.dealType}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">{order.creatorName}</TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">{order.brandName}</TableCell>
                  <TableCell className="text-[13px] font-bold text-[#1e3d2e]">{formatPrice(order.amount || 0)}</TableCell>
                  <TableCell className="text-[13px] text-[#1e3d2e]">{order.createdAt ? formatDate(new Date(order.createdAt)) : '-'}</TableCell>
                  <TableCell className="text-right text-[13px] text-[#1e3d2e]">
                    <div className="flex justify-end">
                      <Select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onValueChange={(value) => updateStatus(order, value as OrderStatus)}
                      >
                        <SelectTrigger className="w-[10.5rem] border-[#d1ddd6]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="capitalize">{s.replace('_', ' ')}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                      <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f0ec]">
                        <ShoppingBag className="size-5 text-[#2d6b4e]" />
                      </span>
                      <p className="text-sm font-extrabold text-[#1e3d2e]">No orders found</p>
                      <p className="text-[11px] text-[#87938b]">Try adjusting your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Status summary */}
          {orders.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {orderStatuses.map((s) => {
                const count = orders.filter((o) => o.status === s).length;
                if (count === 0) return null;
                return (
                  <div key={s} className="inline-flex items-center gap-1.5 rounded-full border border-[#edf1ed] bg-[#f9faf8] px-2.5 py-1">
                    <StatusChip status={s} />
                    <span className="text-[11px] font-bold text-[#496159]">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-5 flex flex-col gap-3 border-t border-[#f0f3f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] text-[#87938b]">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isLoading || page <= 0}
                onClick={() => loadOrders(page - 1)}
              >
                Previous
              </button>
              <button
                className="inline-flex h-9 items-center rounded-xl border border-[#d1ddd6] px-3.5 text-[12px] font-bold text-[#2d6b4e] transition hover:bg-[#e8f0ec] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isLoading || page + 1 >= totalPages}
                onClick={() => loadOrders(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
