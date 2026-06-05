'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Users</h1>
          <p className="text-sm text-muted-foreground">{total} platform accounts</p>
        </div>
        <Button variant="outline" className="min-h-11 gap-2" onClick={() => loadUsers(page)} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moderation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applyFilters();
                }}
                placeholder="Search name, email, username"
                className="pl-9"
              />
            </div>
            <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Enabled</SelectItem>
                <SelectItem value="inactive">Disabled</SelectItem>
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="min-w-[14rem]">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>{user.active ? 'Enabled' : 'Disabled'}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={user.active}
                      disabled={updatingId === user.id || user.role === 'platform_admin'}
                      onCheckedChange={(active) => updateStatus(user, active)}
                      aria-label={`Set ${user.name} active status`}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={isLoading || page <= 0} onClick={() => loadUsers(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" disabled={isLoading || page + 1 >= totalPages} onClick={() => loadUsers(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
