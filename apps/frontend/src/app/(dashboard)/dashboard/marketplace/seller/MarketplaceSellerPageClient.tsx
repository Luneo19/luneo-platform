'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Store,
  Package,
  TrendingUp,
  Download,
  Star,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradePrompt } from '@/components/upgrade/UpgradePrompt';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface SellerItem {
  id: string;
  title: string;
  type: string;
  category?: string | null;
  price: number | string;
  currency: string;
  downloads: number;
  rating?: number | string | null;
  reviewCount: number;
  isActive: boolean;
  _count?: { reviews: number; purchases: number };
}

interface DashboardResponse {
  totalItems: number;
  totalRevenue: number;
  totalDownloads: number;
  avgRating: number | null;
  items: SellerItem[];
  recentPurchases: Array<{
    id: string;
    createdAt: string;
    item: { id: string; title: string };
    buyer: { id: string; name: string };
  }>;
}

function getPrice(price: number | string, currency: string): string {
  const p = typeof price === 'string' ? parseFloat(price) : price;
  if (p === 0) return 'Free';
  return `${p} ${currency}`;
}

export function MarketplaceSellerPageClient() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/seller/dashboard', {
        credentials: 'include',
        headers: typeof window !== 'undefined' && localStorage.getItem('brandId')
          ? { 'X-Brand-Id': localStorage.getItem('brandId')! }
          : {},
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message || `API error: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      logger.error('Seller dashboard error', { error: e });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const brandId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (brandId) headers['X-Brand-Id'] = brandId;
      const res = await fetch(`/api/marketplace/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Delete failed');
      }
      setDeleteId(null);
      fetchDashboard();
    } catch (e) {
      logger.error('Delete item error', e);
      alert(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const fallback = (
    <div className="min-h-[60vh] flex items-center justify-center">
      <UpgradePrompt
        requiredPlan="business"
        feature="Marketplace Seller"
        description="Le dashboard vendeur Marketplace est disponible à partir du plan Business."
      />
    </div>
  );

  if (loading) {
    return (
      <PlanGate minimumPlan="business" showUpgradePrompt fallback={fallback}>
        <div className="space-y-6 p-6">
          <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-white/10">
                <CardContent className="pt-6">
                  <div className="h-6 w-20 rounded bg-white/10 animate-pulse" />
                  <div className="h-8 w-16 mt-2 rounded bg-white/10 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PlanGate>
    );
  }

  if (!data) {
    return (
      <PlanGate minimumPlan="business" showUpgradePrompt fallback={fallback}>
        <div className="p-6">
          <Card className="border-white/10 bg-white/5">
            <CardContent className="py-12 text-center text-white/60">
              Failed to load seller dashboard. Make sure you have a brand selected.
            </CardContent>
          </Card>
        </div>
      </PlanGate>
    );
  }

  return (
    <PlanGate minimumPlan="business" showUpgradePrompt fallback={fallback}>
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketplace">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Store className="w-6 h-6" />
              Seller dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">Manage your marketplace listings</p>
          </div>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
          <Link href="/dashboard/marketplace/seller/new">
            <Plus className="w-4 h-4 mr-2" />
            List new item
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-white/60">
              <Package className="w-4 h-4" />
              <span className="text-sm">Total items</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{data.totalItems}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-white/60">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total revenue</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{data.totalRevenue.toFixed(2)} CHF</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-white/60">
              <Download className="w-4 h-4" />
              <span className="text-sm">Total downloads</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{data.totalDownloads}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-white/60">
              <Star className="w-4 h-4" />
              <span className="text-sm">Avg. rating</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {data.avgRating != null ? data.avgRating.toFixed(1) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items table */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Your items</CardTitle>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <p className="text-white/60 py-8 text-center">
              No items yet. Click &quot;List new item&quot; to add your first listing.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Title</TableHead>
                  <TableHead className="text-white/70">Type</TableHead>
                  <TableHead className="text-white/70">Price</TableHead>
                  <TableHead className="text-white/70">Downloads</TableHead>
                  <TableHead className="text-white/70">Rating</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id} className="border-white/10">
                    <TableCell className="font-medium text-white">{item.title}</TableCell>
                    <TableCell className="text-white/70">{item.type}</TableCell>
                    <TableCell className="text-white/70">{getPrice(item.price, item.currency)}</TableCell>
                    <TableCell className="text-white/70">{item.downloads}</TableCell>
                    <TableCell className="text-white/70">
                      {item.rating != null ? Number(item.rating).toFixed(1) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className={item.isActive ? 'bg-green-600' : 'bg-white/20'}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white" asChild>
                          <Link href={`/dashboard/marketplace/seller/edit/${item.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Recent purchases */}
      {data.recentPurchases?.length > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white">Recent purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recentPurchases.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm text-white/70">
                  <span>{p.item?.title ?? p.id} — {p.buyer?.name ?? 'Unknown'}</span>
                  <span className="text-white/50">{new Date(p.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="border-white/10 bg-[#1a1a2e] text-white">
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
          </DialogHeader>
          <p className="text-white/70">This will deactivate the item. It will no longer appear in the marketplace.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="border-white/20 text-white">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PlanGate>
  );
}
