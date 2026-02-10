'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Filter,
  Star,
  Download,
  Store,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';

const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'jewelry', label: 'Jewelry' },
  { value: 'watches', label: 'Watches' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
];

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'TEMPLATE', label: 'Template' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'MODEL_3D', label: '3D Model' },
  { value: 'TEXTURE', label: 'Texture' },
  { value: 'ANIMATION', label: 'Animation' },
  { value: 'PROMPT_PACK', label: 'Prompt pack' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Best rated' },
];

interface Seller {
  id: string;
  name: string;
  logo?: string | null;
}

interface MarketplaceItem {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  category?: string | null;
  tags: string[];
  price: number | string;
  currency: string;
  previewImages: string[];
  fileUrl?: string | null;
  fileType?: string | null;
  downloads: number;
  rating?: number | string | null;
  reviewCount: number;
  isFeatured: boolean;
  seller: Seller;
  _count?: { reviews: number; purchases: number };
}

interface ListResponse {
  items: MarketplaceItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

function getPrice(item: MarketplaceItem): string {
  const p = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
  if (p === 0) return 'Free';
  return `${p} ${item.currency}`;
}

function getRating(item: MarketplaceItem): number | null {
  if (item.rating == null) return null;
  return typeof item.rating === 'string' ? parseFloat(item.rating) : item.rating;
}

export function MarketplacePageClient() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MarketplaceItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category && category !== 'all') params.set('category', category);
    if (type && type !== 'all') params.set('type', type);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '20');
    if (priceFilter === 'free') {
      params.set('minPrice', '0');
      params.set('maxPrice', '0');
    } else if (priceFilter === 'paid') {
      params.set('minPrice', '0.01');
    }
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    try {
      const brandId = typeof window !== 'undefined' ? localStorage.getItem('brandId') : null;
      const headers: Record<string, string> = {};
      if (brandId) headers['X-Brand-Id'] = brandId;
      const res = await fetch(`/api/marketplace?${params.toString()}`, {
        credentials: 'include',
        headers,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData(json);
    } catch (e) {
      logger.error('Marketplace list error', e);
      setData({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [search, category, type, sort, page, priceFilter, minPrice, maxPrice]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedId(id);
    try {
      const res = await fetch(`/api/marketplace/item/${id}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setDetail(json);
    } catch (e) {
      logger.error('Marketplace item detail error', e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handlePurchase = async (id: string) => {
    setPurchasing(id);
    try {
      const res = await fetch(`/api/marketplace/${id}/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Purchase failed');

      // After purchase, fetch the secure download URL
      try {
        const dlRes = await fetch(`/api/marketplace/${id}/download`, { credentials: 'include' });
        if (dlRes.ok) {
          const dlData = await dlRes.json();
          if (dlData.url) {
            const a = document.createElement('a');
            a.href = dlData.url;
            a.download = dlData.fileName || 'download';
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        }
      } catch {
        // Fallback to direct fileUrl
        const downloadUrl = json.item?.fileUrl ?? json.fileUrl;
        if (downloadUrl) window.open(downloadUrl, '_blank');
      }

      fetchList();
      setSelectedId(null);
      setDetail(null);
    } catch (e) {
      logger.error('Purchase error', e);
      alert(typeof e === 'object' && e && 'message' in e ? String((e as Error).message) : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace</h1>
          <p className="text-white/60 text-sm mt-1">
            Templates and assets from other brands
          </p>
        </div>
        <Link href="/dashboard/marketplace/seller">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Store className="w-4 h-4 mr-2" />
            Seller dashboard
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={category || 'all'} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value || 'all'} value={c.value || 'all'}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type || 'all'} onValueChange={(v) => setType(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value || 'all'} value={t.value || 'all'}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={priceFilter} onValueChange={(v) => setPriceFilter(v as 'all' | 'free' | 'paid')}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="all" className="data-[state=active]:bg-white/10 text-white">All</TabsTrigger>
                <TabsTrigger value="free" className="data-[state=active]:bg-white/10 text-white">Free</TabsTrigger>
                <TabsTrigger value="paid" className="data-[state=active]:bg-white/10 text-white">Paid</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-white/10 animate-pulse">
              <div className="aspect-video bg-white/10" />
              <CardHeader className="pb-2"><div className="h-5 w-3/4 rounded bg-white/10" /></CardHeader>
              <CardContent className="pt-0"><div className="h-4 w-1/3 rounded bg-white/10" /></CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="py-12 text-center text-white/60">
            No items found. Try adjusting filters or search.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors cursor-pointer group"
                onClick={() => fetchDetail(item.id)}
              >
                <div className="relative aspect-video bg-white/10">
                  {item.previewImages?.[0] ? (
                    <Image
                      src={item.previewImages[0]}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <LayoutGrid className="w-12 h-12" />
                    </div>
                  )}
                  {item.isFeatured && (
                    <Badge className="absolute top-2 right-2 bg-amber-500/90 text-black">Featured</Badge>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-300">{item.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-white/60">
                    <Store className="w-3.5 h-3.5" />
                    <span className="truncate">{item.seller?.name ?? '—'}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between">
                  <span className="font-medium text-white">{getPrice(item)}</span>
                  <div className="flex items-center gap-2">
                    {getRating(item) != null && (
                      <span className="flex items-center gap-1 text-sm text-white/70">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {Number(getRating(item)).toFixed(1)}
                      </span>
                    )}
                    <span className="text-xs text-white/50">{item.downloads} downloads</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-white/20 text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-white/70">
                Page {page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="border-white/20 text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-lg border-white/10 bg-[#1a1a2e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {detailLoading ? 'Loading...' : detail?.title ?? 'Item'}
            </DialogTitle>
          </DialogHeader>
          {detail && !detailLoading && (
            <>
              <div className="space-y-4">
                {detail.previewImages?.[0] && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-white/10">
                    <Image
                      src={detail.previewImages[0]}
                      alt={detail.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-white/10 text-white">{detail.type}</Badge>
                  {detail.category && (
                    <Badge variant="outline" className="border-white/20 text-white/80">{detail.category}</Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-white/70">
                    <Store className="w-4 h-4" />
                    {detail.seller?.name}
                  </div>
                </div>
                {detail.description && (
                  <p className="text-sm text-white/70">{detail.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-white">{getPrice(detail)}</span>
                  {getRating(detail) != null && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      {Number(getRating(detail)).toFixed(1)} ({detail.reviewCount} reviews)
                    </span>
                  )}
                  <span className="text-white/50">{detail.downloads} downloads</span>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setSelectedId(null)} className="border-white/20 text-white">
                  Close
                </Button>
                <Button
                  onClick={() => handlePurchase(detail.id)}
                  disabled={purchasing === detail.id}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {purchasing === detail.id ? 'Processing...' : detail.price === 0 || detail.price === '0' ? 'Download' : 'Buy'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
