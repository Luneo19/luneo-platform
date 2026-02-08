'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Coins } from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const API_BASE = '/api/v1/credits';

interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceCents: number;
  stripePriceId: string | null;
  isActive: boolean;
  isFeatured?: boolean;
  savings?: number | null;
  badge?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function formatPrice(priceCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(priceCents / 100);
}

function AdminCreditPacksContent() {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    credits: 100,
    priceCents: 999,
    stripePriceId: '',
    description: '',
    isActive: true,
    isFeatured: false,
    savings: 0,
    badge: '',
  });

  const fetchPacks = useCallback(async () => {
    try {
      const data = await api.get<CreditPack[]>(`${API_BASE}/admin/packs`);
      setPacks(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch credit packs', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setPacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  const openCreate = () => {
    setForm({
      name: '',
      credits: 100,
      priceCents: 999,
      stripePriceId: '',
      description: '',
      isActive: true,
      isFeatured: false,
      savings: 0,
      badge: '',
    });
    setCreateOpen(true);
  };

  const openEdit = (pack: CreditPack) => {
    setForm({
      name: pack.name,
      credits: pack.credits,
      priceCents: pack.priceCents,
      stripePriceId: pack.stripePriceId ?? '',
      description: pack.badge ?? '',
      isActive: pack.isActive,
      isFeatured: pack.isFeatured ?? false,
      savings: pack.savings ?? 0,
      badge: pack.badge ?? '',
    });
    setEditId(pack.id);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post(`${API_BASE}/admin/packs`, {
        name: form.name,
        credits: form.credits,
        priceCents: form.priceCents,
        stripePriceId: form.stripePriceId || undefined,
        description: form.description || form.badge || undefined,
        badge: form.badge || form.description || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        savings: form.savings || undefined,
      });
      setCreateOpen(false);
      await fetchPacks();
    } catch (error) {
      logger.error('Failed to create credit pack', { error, form });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await api.put(`${API_BASE}/admin/packs/${editId}`, {
        name: form.name,
        credits: form.credits,
        priceCents: form.priceCents,
        stripePriceId: form.stripePriceId || null,
        description: form.description || form.badge || undefined,
        badge: form.badge || form.description || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        savings: form.savings || null,
      });
      setEditId(null);
      await fetchPacks();
    } catch (error) {
      logger.error('Failed to update credit pack', { error, editId, form });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await api.delete(`${API_BASE}/admin/packs/${deleteId}`);
      setDeleteId(null);
      await fetchPacks();
    } catch (error) {
      logger.error('Failed to delete credit pack', { error, deleteId });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pack: CreditPack) => {
    try {
      await api.put(`${API_BASE}/admin/packs/${pack.id}`, {
        isActive: !pack.isActive,
      });
      await fetchPacks();
    } catch (error) {
      logger.error('Failed to toggle pack active', { error, packId: pack.id });
    }
  };

  const formFields = (
    <>
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Starter Pack"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="credits">Credits</Label>
        <Input
          id="credits"
          type="number"
          min={1}
          value={form.credits}
          onChange={(e) => setForm((f) => ({ ...f, credits: parseInt(e.target.value, 10) || 0 }))}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="priceCents">Price (cents)</Label>
        <Input
          id="priceCents"
          type="number"
          min={0}
          value={form.priceCents}
          onChange={(e) => setForm((f) => ({ ...f, priceCents: parseInt(e.target.value, 10) || 0 }))}
        />
        <p className="text-xs text-muted-foreground">
          Display: {formatPrice(form.priceCents)} EUR
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stripePriceId">Stripe Price ID</Label>
        <Input
          id="stripePriceId"
          value={form.stripePriceId}
          onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value }))}
          placeholder="price_xxx"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="badge">Badge / Description</Label>
        <Input
          id="badge"
          value={form.badge || form.description}
          onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value, description: e.target.value }))}
          placeholder="e.g. Best Value"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="savings">Savings %</Label>
        <Input
          id="savings"
          type="number"
          min={0}
          value={form.savings}
          onChange={(e) => setForm((f) => ({ ...f, savings: parseInt(e.target.value, 10) || 0 }))}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={form.isActive}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="isFeatured"
          checked={form.isFeatured}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
        />
        <Label htmlFor="isFeatured">Featured</Label>
      </div>
    </>
  );

  return (
    <ErrorBoundary>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Coins className="h-6 w-6" />
              Credit Packs
            </h1>
            <p className="text-muted-foreground">
              Manage credit packs available for purchase. Prices in EUR (stored as cents).
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Pack
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create credit pack</DialogTitle>
                <DialogDescription>
                  Add a new pack. Link a Stripe Price ID for checkout.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">{formFields}</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || !form.name}>
                  {saving ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Packs</CardTitle>
            <CardDescription>All credit packs. Toggle active to hide from store.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading…
              </div>
            ) : packs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No packs yet. Create one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Price (EUR)</TableHead>
                    <TableHead>Stripe Price ID</TableHead>
                    <TableHead>Badge / Savings</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packs.map((pack) => (
                    <TableRow key={pack.id}>
                      <TableCell className="font-medium">
                        {pack.name}
                        {pack.isFeatured && (
                          <Badge variant="secondary" className="ml-2">Featured</Badge>
                        )}
                      </TableCell>
                      <TableCell>{pack.credits}</TableCell>
                      <TableCell>{formatPrice(pack.priceCents)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {pack.stripePriceId || '—'}
                      </TableCell>
                      <TableCell>
                        {pack.badge && <Badge variant="outline">{pack.badge}</Badge>}
                        {pack.savings != null && pack.savings > 0 && (
                          <span className="text-muted-foreground text-sm ml-1">
                            {pack.savings}% off
                          </span>
                        )}
                        {!pack.badge && (pack.savings == null || pack.savings === 0) && '—'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={pack.isActive}
                          onCheckedChange={() => toggleActive(pack)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(pack)}
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(pack.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit credit pack</DialogTitle>
              <DialogDescription>
                Update name, price, Stripe Price ID, and visibility.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditId(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={saving || !form.name}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete pack?</DialogTitle>
              <DialogDescription>
                This will permanently remove this credit pack. Existing transactions will keep
                the pack reference but the pack will no longer be listed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

export default function AdminCreditPacksPage() {
  return <AdminCreditPacksContent />;
}
