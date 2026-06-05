'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminService, type AdminOrder } from '@/services/admin.service';
import { formatDate, formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const orderStatuses: OrderStatus[] = ['pending', 'accepted', 'in_progress', 'delivered', 'review', 'revision', 'completed', 'cancelled'];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Orders</h1>
          <p className="text-sm text-muted-foreground">{total} creator-brand orders</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={() => loadOrders(page)} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Oversight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
                placeholder="Search package, creator, brand"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
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
            <Button className="min-h-10 gap-2" onClick={applyFilters} disabled={isLoading}>
              <Search className="h-4 w-4" />
              Apply
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="min-w-[13rem]">
                      <p className="font-medium">{order.packageTitle}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.dealType}</p>
                    </div>
                  </TableCell>
                  <TableCell>{order.creatorName}</TableCell>
                  <TableCell>{order.brandName}</TableCell>
                  <TableCell>{formatPrice(order.amount || 0)}</TableCell>
                  <TableCell>{order.createdAt ? formatDate(new Date(order.createdAt)) : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onValueChange={(value) => updateStatus(order, value as OrderStatus)}
                      >
                        <SelectTrigger className="w-[10.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              <span className="capitalize">{status.replace('_', ' ')}</span>
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
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-wrap gap-2">
            {orderStatuses.map((status) => (
              <Badge key={status} variant="outline" className="capitalize">
                {status.replace('_', ' ')}: {orders.filter((order) => order.status === status).length}
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isLoading || page <= 0} onClick={() => loadOrders(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" disabled={isLoading || page + 1 >= totalPages} onClick={() => loadOrders(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
