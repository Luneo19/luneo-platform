'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
        <Label htmlFor="name" className="text-white/80">Name</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Starter Pack"
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="credits" className="text-white/80">Credits</Label>
        <Input
          id="credits"
          type="number"
          min={1}
          value={form.credits}
          onChange={(e) => setForm((f) => ({ ...f, credits: parseInt(e.target.value, 10) || 0 }))}
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="priceCents" className="text-white/80">Price (cents)</Label>
        <Input
          id="priceCents"
          type="number"
          min={0}
          value={form.priceCents}
          onChange={(e) => setForm((f) => ({ ...f, priceCents: parseInt(e.target.value, 10) || 0 }))}
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
        <p className="text-xs text-white/40">
          Display: {formatPrice(form.priceCents)} EUR
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="stripePriceId" className="text-white/80">Stripe Price ID</Label>
        <Input
          id="stripePriceId"
          value={form.stripePriceId}
          onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value }))}
          placeholder="price_xxx"
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="badge" className="text-white/80">Badge / Description</Label>
        <Input
          id="badge"
          value={form.badge || form.description}
          onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value, description: e.target.value }))}
          placeholder="e.g. Best Value"
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="savings" className="text-white/80">Savings %</Label>
        <Input
          id="savings"
          type="number"
          min={0}
          value={form.savings}
          onChange={(e) => setForm((f) => ({ ...f, savings: parseInt(e.target.value, 10) || 0 }))}
          className="dash-input border-white/[0.08] bg-white/[0.04] text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="isActive"
          checked={form.isActive}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
        />
        <Label htmlFor="isActive" className="text-white/80">Active</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="isFeatured"
          checked={form.isFeatured}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))}
        />
        <Label htmlFor="isFeatured" className="text-white/80">Featured</Label>
      </div>
    </>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2 text-white">
            <Coins className="h-6 w-6" />
            Credit Packs
          </h1>
          <p className="text-white/60">
            Manage credit packs available for purchase. Prices in EUR (stored as cents).
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Pack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md dash-card border-white/[0.06] bg-[#12121a] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Create credit pack</DialogTitle>
              <DialogDescription className="text-white/60">
                Add a new pack. Link a Stripe Price ID for checkout.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">{formFields}</div>
            <DialogFooter>
              <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !form.name} className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90">
                {saving ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Packs</CardTitle>
          <CardDescription className="text-white/60">All credit packs. Toggle active to hide from store.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-white/40">
              Loading…
            </div>
          ) : packs.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              No packs yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06] hover:bg-white/[0.02]">
                  <TableHead className="text-white/60 border-white/[0.06]">Name</TableHead>
                  <TableHead className="text-white/60 border-white/[0.06]">Credits</TableHead>
                  <TableHead className="text-white/60 border-white/[0.06]">Price (EUR)</TableHead>
                  <TableHead className="text-white/60 border-white/[0.06]">Stripe Price ID</TableHead>
                  <TableHead className="text-white/60 border-white/[0.06]">Badge / Savings</TableHead>
                  <TableHead className="text-white/60 border-white/[0.06]">Active</TableHead>
                  <TableHead className="w-[120px] text-white/60 border-white/[0.06]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packs.map((pack) => (
                  <TableRow key={pack.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                    <TableCell className="font-medium text-white border-white/[0.06]">
                      {pack.name}
                      {pack.isFeatured && (
                        <span className="dash-badge dash-badge-enterprise ml-2">Featured</span>
                      )}
                    </TableCell>
                    <TableCell className="text-white border-white/[0.06]">{pack.credits}</TableCell>
                    <TableCell className="text-white border-white/[0.06]">{formatPrice(pack.priceCents)}</TableCell>
                    <TableCell className="font-mono text-xs text-white/60 border-white/[0.06]">
                      {pack.stripePriceId || '—'}
                    </TableCell>
                    <TableCell className="border-white/[0.06]">
                      {pack.badge && <span className="dash-badge dash-badge-pro">{pack.badge}</span>}
                      {pack.savings != null && pack.savings > 0 && (
                        <span className="text-white/60 text-sm ml-1">
                          {pack.savings}% off
                        </span>
                      )}
                      {!pack.badge && (pack.savings == null || pack.savings === 0) && <span className="text-white/40">—</span>}
                    </TableCell>
                    <TableCell className="border-white/[0.06]">
                      <Switch
                        checked={pack.isActive}
                        onCheckedChange={() => toggleActive(pack)}
                      />
                    </TableCell>
                    <TableCell className="border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/[0.04] hover:text-white"
                          onClick={() => openEdit(pack)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#f87171] hover:bg-[#f87171]/10"
                          onClick={() => setDeleteId(pack.id)}
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-md dash-card border-white/[0.06] bg-[#12121a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit credit pack</DialogTitle>
            <DialogDescription className="text-white/60">
              Update name, price, Stripe Price ID, and visibility.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">{formFields}</div>
          <DialogFooter>
            <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]" onClick={() => setEditId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !form.name} className="bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-90">
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="dash-card border-white/[0.06] bg-[#12121a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete pack?</DialogTitle>
            <DialogDescription className="text-white/60">
              This will permanently remove this credit pack. Existing transactions will keep
              the pack reference but the pack will no longer be listed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="border-white/[0.08] text-white hover:bg-white/[0.04]" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f87171]/20 text-[#f87171] border border-[#f87171]/30 hover:bg-[#f87171]/30"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminCreditPacksPage() {
  return (
    <ErrorBoundary level="page" componentName="AdminCreditPacksPage">
      <AdminCreditPacksContent />
    </ErrorBoundary>
  );
}
