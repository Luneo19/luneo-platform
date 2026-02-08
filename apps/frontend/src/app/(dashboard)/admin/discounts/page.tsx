'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

type DiscountType = 'PERCENTAGE' | 'FIXED';

interface DiscountBrand {
  id: string;
  name: string | null;
}

interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minPurchaseCents: number | null;
  maxDiscountCents: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  description: string | null;
  brandId: string | null;
  brand: DiscountBrand | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  data: Discount[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface FormState {
  code: string;
  type: DiscountType;
  value: string;
  minPurchaseCents: string;
  maxDiscountCents: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  isActive: boolean;
  description: string;
}

const emptyForm: FormState = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  minPurchaseCents: '',
  maxDiscountCents: '',
  validFrom: '',
  validTo: '',
  usageLimit: '',
  isActive: true,
  description: '',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function getStatus(d: Discount): 'active' | 'inactive' | 'expired' {
  const now = new Date();
  if (!d.isActive) return 'inactive';
  if (new Date(d.validUntil) < now) return 'expired';
  if (new Date(d.validFrom) > now) return 'inactive';
  return 'active';
}

function formatValue(d: Discount): string {
  if (d.type === 'PERCENTAGE') return `${d.value}%`;
  return `${(d.value / 100).toFixed(2)} €`;
}

function AdminDiscountsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<ListResponse>('/api/v1/admin/discounts', { params });
      setData(res);
    } catch (error) {
      logger.error('Failed to fetch discounts', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingId(d.id);
    setForm({
      code: d.code,
      type: d.type,
      value: String(d.value),
      minPurchaseCents: d.minPurchaseCents != null ? String(d.minPurchaseCents) : '',
      maxDiscountCents: d.maxDiscountCents != null ? String(d.maxDiscountCents) : '',
      validFrom: d.validFrom.slice(0, 16),
      validTo: d.validUntil.slice(0, 16),
      usageLimit: d.usageLimit != null ? String(d.usageLimit) : '',
      isActive: d.isActive,
      description: d.description ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        type: form.type,
        value: form.value ? parseInt(form.value, 10) : 0,
        minPurchaseCents: form.minPurchaseCents ? parseInt(form.minPurchaseCents, 10) : undefined,
        maxDiscountCents: form.maxDiscountCents ? parseInt(form.maxDiscountCents, 10) : undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : undefined,
        isActive: form.isActive,
        description: form.description || undefined,
      };
      if (editingId) {
        await api.put(`/api/v1/admin/discounts/${editingId}`, payload);
      } else {
        await api.post('/api/v1/admin/discounts', payload);
      }
      setDialogOpen(false);
      fetchDiscounts();
    } catch (err) {
      logger.error('Save discount failed', { err });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/admin/discounts/${id}`);
      setDeleteConfirmId(null);
      fetchDiscounts();
    } catch (err) {
      logger.error('Delete discount failed', { err });
    } finally {
      setDeleting(false);
    }
  };

  const discounts = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discount Codes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage coupon / discount codes
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discount Codes</CardTitle>
          <CardDescription>
            {meta ? `${meta.total} discount(s)` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No discount codes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((d) => {
                      const status = getStatus(d);
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono font-medium">{d.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{d.type}</Badge>
                          </TableCell>
                          <TableCell>{formatValue(d)}</TableCell>
                          <TableCell>
                            {status === 'active' && (
                              <Badge variant="default">Active</Badge>
                            )}
                            {status === 'inactive' && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {status === 'expired' && (
                              <Badge variant="destructive">Expired</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {d.usageLimit != null
                              ? `${d.usageCount} / ${d.usageLimit}`
                              : String(d.usageCount)}
                          </TableCell>
                          <TableCell>{formatDate(d.validFrom)}</TableCell>
                          <TableCell>{formatDate(d.validUntil)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(d)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteConfirmId(d.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the discount code.' : 'Add a new discount code.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. WELCOME10"
                required
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: DiscountType) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed amount (cents)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">
                Value {form.type === 'PERCENTAGE' ? '(0-100)' : '(cents)'}
              </Label>
              <Input
                id="value"
                type="number"
                min={0}
                max={form.type === 'PERCENTAGE' ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Min purchase (cents)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min={0}
                  value={form.minPurchaseCents}
                  onChange={(e) => setForm((f) => ({ ...f, minPurchaseCents: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Max discount (cents)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min={0}
                  value={form.maxDiscountCents}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscountCents: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid from</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">Valid to</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={form.validTo}
                  onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit">Max usages</Label>
              <Input
                id="usageLimit"
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete discount</DialogTitle>
            <DialogDescription>
              This will permanently delete this discount code. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const MemoizedPage = memo(AdminDiscountsPage);

export default function AdminDiscountsPageWrapper() {
  return (
    <ErrorBoundary level="page" componentName="AdminDiscountsPage">
      <MemoizedPage />
    </ErrorBoundary>
  );
}
