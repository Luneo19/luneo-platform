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
          <h1 className="text-3xl font-bold text-white">Discount Codes</h1>
          <p className="text-white/60 mt-1">
            Create and manage coupon / discount codes
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Filters</CardTitle>
          <CardDescription className="text-white/60">Filter by status</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[180px] dash-input border-white/[0.08] bg-white/[0.04] text-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/[0.06]">
              <SelectItem value="all" className="text-white focus:bg-white/[0.06]">All statuses</SelectItem>
              <SelectItem value="active" className="text-white focus:bg-white/[0.06]">Active</SelectItem>
              <SelectItem value="inactive" className="text-white focus:bg-white/[0.06]">Inactive</SelectItem>
              <SelectItem value="expired" className="text-white focus:bg-white/[0.06]">Expired</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Discount Codes</CardTitle>
          <CardDescription className="text-white/60">
            {meta ? `${meta.total} discount(s)` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
                    <TableHead className="text-white/60 border-white/[0.06]">Code</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Type</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Value</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Status</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Usage</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Valid From</TableHead>
                    <TableHead className="text-white/60 border-white/[0.06]">Valid To</TableHead>
                    <TableHead className="text-right text-white/60 border-white/[0.06]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.length === 0 ? (
                    <TableRow className="border-white/[0.06]">
                      <TableCell colSpan={8} className="text-center text-white/40 py-8 border-white/[0.06]">
                        No discount codes found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((d) => {
                      const status = getStatus(d);
                      return (
                        <TableRow key={d.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                          <TableCell className="font-mono font-medium text-white border-white/[0.06]">{d.code}</TableCell>
                          <TableCell className="border-white/[0.06]">
                            <span className="dash-badge dash-badge-pro">{d.type}</span>
                          </TableCell>
                          <TableCell className="text-white border-white/[0.06]">{formatValue(d)}</TableCell>
                          <TableCell className="border-white/[0.06]">
                            {status === 'active' && (
                              <span className="dash-badge dash-badge-new">Active</span>
                            )}
                            {status === 'inactive' && (
                              <span className="dash-badge text-white/60 border-white/20">Inactive</span>
                            )}
                            {status === 'expired' && (
                              <span className="dash-badge dash-badge-live">Expired</span>
                            )}
                          </TableCell>
                          <TableCell className="text-white/80 border-white/[0.06]">
                            {d.usageLimit != null
                              ? `${d.usageCount} / ${d.usageLimit}`
                              : String(d.usageCount)}
                          </TableCell>
                          <TableCell className="text-white/80 border-white/[0.06]">{formatDate(d.validFrom)}</TableCell>
                          <TableCell className="text-white/80 border-white/[0.06]">{formatDate(d.validUntil)}</TableCell>
                          <TableCell className="text-right border-white/[0.06]">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/[0.08] text-white hover:bg-white/[0.04]"
                                onClick={() => openEdit(d)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/[0.08] text-[#f87171] hover:bg-[#f87171]/10"
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
                  <p className="text-sm text-white/60">
                    Page {meta.page} of {meta.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.08] text-white hover:bg-white/[0.04] disabled:opacity-50"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/[0.08] text-white hover:bg-white/[0.04] disabled:opacity-50"
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dash-card border-white/[0.06] bg-[#12121a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
            <DialogDescription className="text-white/60">
              {editingId ? 'Update the discount code.' : 'Add a new discount code.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-white/80">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. WELCOME10"
                required
                disabled={!!editingId}
                className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v: DiscountType) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger className="dash-input border-white/[0.08] bg-white/[0.04] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/[0.06]">
                  <SelectItem value="PERCENTAGE" className="text-white focus:bg-white/[0.06]">Percentage</SelectItem>
                  <SelectItem value="FIXED" className="text-white focus:bg-white/[0.06]">Fixed amount (cents)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value" className="text-white/80">
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
                className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPurchase" className="text-white/80">Min purchase (cents)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min={0}
                  value={form.minPurchaseCents}
                  onChange={(e) => setForm((f) => ({ ...f, minPurchaseCents: e.target.value }))}
                  className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscount" className="text-white/80">Max discount (cents)</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  min={0}
                  value={form.maxDiscountCents}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscountCents: e.target.value }))}
                  className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-white/80">Valid from</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                  className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo" className="text-white/80">Valid to</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={form.validTo}
                  onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                  className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageLimit" className="text-white/80">Max usages</Label>
              <Input
                id="usageLimit"
                type="number"
                min={0}
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white/80">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
                className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
              <Label htmlFor="isActive" className="text-white/80">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete discount</DialogTitle>
            <DialogDescription className="text-white/60">
              This will permanently delete this discount code. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 hover:bg-[#f87171]/30"
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
