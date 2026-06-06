'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Payments Audit</h1>
          <p className="text-sm text-muted-foreground">Inspect immutable payment operations across creators and brands.</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={() => load(page)} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{total} payment audit entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && load(0)}
                placeholder="Search actor, action, target, details"
                className="pl-9"
              />
            </div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {paymentActions.map((item) => <SelectItem key={item} value={item}>{readable(item)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              value={brandId}
              onChange={(event) => setBrandId(event.target.value)}
              placeholder="Filter by brand UUID"
            />
            <Button onClick={() => load(0)} disabled={isLoading}><Search className="h-4 w-4" /> Apply</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(new Date(log.createdAt))}</TableCell>
                  <TableCell>{log.actorName}</TableCell>
                  <TableCell>
                    <p>{log.brandName || '-'}</p>
                    <p className="max-w-[11rem] truncate text-xs text-muted-foreground">{log.brandId || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{readable(log.action)}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{log.targetType}</span>
                    <p className="max-w-[11rem] truncate text-xs text-muted-foreground">{log.targetId || '-'}</p>
                  </TableCell>
                  <TableCell className="max-w-[22rem] text-sm text-muted-foreground">{log.details || '-'}</TableCell>
                </TableRow>
              ))}
              {!isLoading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payment audit entries found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Page {page + 1} of {pages}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isLoading || page <= 0} onClick={() => load(page - 1)}>Previous</Button>
              <Button variant="outline" disabled={isLoading || page + 1 >= pages} onClick={() => load(page + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

