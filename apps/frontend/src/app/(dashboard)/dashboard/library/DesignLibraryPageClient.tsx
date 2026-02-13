'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/i18n/useI18n';
import {
  LayoutGrid,
  List,
  Plus,
  Download,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Share2,
  FolderPlus,
  Sparkles,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  SECTOR_PROMPTS,
  CATEGORY_FILTER_OPTIONS,
  DATE_RANGE_OPTIONS,
  SORT_OPTIONS,
} from './constants/design-library';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

// Types
type ViewMode = 'grid' | 'list';
type DesignStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface Design {
  id: string;
  name: string | null;
  description: string | null;
  prompt: string;
  status: DesignStatus;
  previewUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string; price?: number };
  brand?: { id: string; name: string; logo?: string | null };
}

interface DesignsResponse {
  designs: Design[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const STATUS_LABELS: Record<DesignStatus, string> = {
  PENDING: 'Brouillon',
  PROCESSING: 'En cours',
  COMPLETED: 'Terminé',
  FAILED: 'Échoué',
  CANCELLED: 'Archivé',
};

const STATUS_VARIANTS: Record<DesignStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  PROCESSING: 'default',
  COMPLETED: 'outline',
  FAILED: 'destructive',
  CANCELLED: 'outline',
};

function getImageUrl(d: Design): string | null {
  return d.imageUrl ?? d.previewUrl ?? null;
}

function filterByCategory(designs: Design[], category: string): Design[] {
  if (category === 'all') return designs;
  const lower = category.toLowerCase();
  return designs.filter((d) => {
    const name = (d.product?.name ?? d.name ?? d.prompt ?? '').toLowerCase();
    if (lower === 'jewelry') return /ring|necklace|earring|bracelet|bijou|collier|bague|boucle/.test(name);
    if (lower === 'watches') return /watch|montre|chrono/.test(name);
    if (lower === 'glasses') return /glass|lunette|sunglass|aviator/.test(name);
    if (lower === 'accessories') return /belt|wallet|bag|ceinture|portefeuille/.test(name);
    return true;
  });
}

function filterByDateRange(designs: Design[], range: string): Design[] {
  if (range === 'all') return designs;
  const days = parseInt(range, 10);
  if (Number.isNaN(days)) return designs;
  const cut = new Date();
  cut.setDate(cut.getDate() - days);
  return designs.filter((d) => new Date(d.createdAt) >= cut);
}

function sortDesigns(designs: Design[], sort: string): Design[] {
  const arr = [...designs];
  const name = (d: Design) => (d.name ?? d.prompt ?? '').toLowerCase();
  switch (sort) {
    case 'oldest':
      return arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'name_az':
      return arr.sort((a, b) => name(a).localeCompare(name(b)));
    case 'name_za':
      return arr.sort((a, b) => name(b).localeCompare(name(a)));
    case 'newest':
    default:
      return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export function DesignLibraryPageClient() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [designs, setDesigns] = useState<Design[]>([]);
  const [pagination, setPagination] = useState<DesignsResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await endpoints.designs.list({
        limit: 100,
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const list = Array.isArray(data) ? data : (data as { designs?: unknown[] }).designs ?? (data as { data?: unknown[] }).data ?? [];
      setDesigns(list as Design[]);
      setPagination((data as { pagination?: DesignsResponse['pagination'] })?.pagination ?? { page: 1, limit: 100, total: list.length, totalPages: 1, hasNext: false, hasPrev: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur lors du chargement';
      setError(message);
      logger.error('Design library fetch failed', { error: e });
      setDesigns([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const filteredDesigns = useMemo(() => {
    let list = filterByCategory(designs, categoryFilter);
    list = filterByDateRange(list, dateRange);
    return sortDesigns(list, sortBy);
  }, [designs, categoryFilter, dateRange, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDesigns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDesigns.map((d) => d.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      for (const id of selectedIds) {
        await endpoints.designs.delete(id);
      }
      setSelectedIds(new Set());
      await fetchDesigns();
    } catch (e) {
      logger.error('Bulk delete failed', { error: e });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportSelected = () => {
    if (selectedIds.size === 0) return;
    const toExport = filteredDesigns.filter((d) => selectedIds.has(d.id));
    toExport.forEach((d) => {
      const url = getImageUrl(d);
      if (url) window.open(url, '_blank');
    });
  };

  const handleDeleteDesign = async (id: string) => {
    try {
      await endpoints.designs.delete(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await fetchDesigns();
    } catch (e) {
      logger.error('Delete design failed', { id, error: e });
    }
  };

  const stats = useMemo(() => {
    const total = designs.length;
    const completed = designs.filter((d) => d.status === 'COMPLETED').length;
    const draft = designs.filter((d) => d.status === 'PENDING' || d.status === 'PROCESSING').length;
    const thisMonth = designs.filter((d) => {
      const created = new Date(d.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, completed, draft, thisMonth };
  }, [designs]);

  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    designs.forEach((d) => {
      const key = new Date(d.createdAt).toISOString().slice(0, 10);
      if (byDay[key] !== undefined) byDay[key]++;
    });
    return Object.entries(byDay).map(([date, count]) => ({ date, count }));
  }, [designs]);

  if (error) {
    return (
      <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => fetchDesigns()}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 dark:bg-background">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t('library.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('library.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="gap-1.5 px-3">
                <LayoutGrid className="h-4 w-4" />
                Grille
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5 px-3">
                <List className="h-4 w-4" />
                Liste
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/ai-studio">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau design
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={handleExportSelected}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('library.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder={t('support.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('library.filters.all')}</SelectItem>
                <SelectItem value="PENDING">Brouillon</SelectItem>
                <SelectItem value="PROCESSING">{t('common.inProgress')}</SelectItem>
                <SelectItem value="COMPLETED">Terminés</SelectItem>
                <SelectItem value="FAILED">Échoués</SelectItem>
                <SelectItem value="CANCELLED">Archivés</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder={t('common.category')} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder={t('common.period')} />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder={t('library.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total designs</p>
            <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Ce mois</p>
            <p className="text-2xl font-semibold text-foreground">{stats.thisMonth}</p>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Terminés</p>
            <p className="text-2xl font-semibold text-foreground">{stats.completed}</p>
          </CardHeader>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-muted-foreground">Brouillons</p>
            <p className="text-2xl font-semibold text-foreground">{stats.draft}</p>
          </CardHeader>
        </Card>
      </div>

      {/* Mini chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <p className="text-sm font-medium text-muted-foreground">Designs créés (14 derniers jours)</p>
        </CardHeader>
        <CardContent>
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="designGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip labelFormatter={(v) => v} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="url(#designGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-foreground">
              {selectedIds.size} élément(s) sélectionné(s)
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportSelected}>
                <Download className="h-4 w-4 mr-2" />
                {t('common.export')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCreateCollectionOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Ajouter à une collection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={bulkActionLoading}
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Annuler la sélection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid / List content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden border-border">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded animate-pulse mb-2 w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDesigns.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground mb-2">{t('library.noItems')}</p>
            <Button asChild>
              <Link href="/dashboard/ai-studio">
                <Plus className="h-4 w-4 mr-2" />
                Créer un design
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDesigns.map((d) => (
            <Card
              key={d.id}
              className="group overflow-hidden border-border hover:border-primary/50 transition-colors"
            >
              <div className="relative aspect-square bg-muted">
                {getImageUrl(d) ? (
                  <Image
                    src={getImageUrl(d)!}
                    alt={d.name ?? d.prompt?.slice(0, 50) ?? 'Design'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Sparkles className="h-12 w-12 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedIds.has(d.id)}
                    onCheckedChange={() => toggleSelect(d.id)}
                    className="border-background bg-background/80"
                  />
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/editor?designId=${d.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/ai-studio?edit=${d.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="h-4 w-4 mr-2" />
                        {t('common.share')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteDesign(d.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-foreground truncate" title={d.name ?? d.prompt}>
                  {d.name ?? d.prompt?.slice(0, 40) ?? 'Sans nom'}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={STATUS_VARIANTS[d.status]} className="text-xs">
                    {d.status === 'PROCESSING' ? t('common.inProgress') : STATUS_LABELS[d.status]}
                  </Badge>
                  {d.product?.name && (
                    <span className="text-xs text-muted-foreground truncate">{d.product.name}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === filteredDesigns.length && filteredDesigns.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>{t('common.category')}</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="w-24">Taille</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDesigns.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(d.id)}
                      onCheckedChange={() => toggleSelect(d.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative h-12 w-12 rounded overflow-hidden bg-muted">
                      {getImageUrl(d) ? (
                        <Image
                          src={getImageUrl(d)!}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {d.name ?? d.prompt?.slice(0, 50) ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[d.status]}>{d.status === 'PROCESSING' ? t('common.inProgress') : STATUS_LABELS[d.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.product?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">—</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/editor?designId=${d.id}`}>
                            <Eye className="h-4 w-4 mr-2" /> Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/ai-studio?edit=${d.id}`}>
                            <Pencil className="h-4 w-4 mr-2" /> Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteDesign(d.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Collections section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Collections</h2>
            <p className="text-sm text-muted-foreground">Regroupez vos designs par projet ou thème</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCreateCollectionOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Nouvelle collection
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune collection pour le moment. Créez-en une pour organiser vos designs.
          </p>
        </CardContent>
      </Card>

      {/* Quick Generate - sector prompts */}
      <Card className="border-border">
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Génération rapide
          </h2>
          <p className="text-sm text-muted-foreground">
            Utilisez un template par secteur pour lancer une génération depuis l’AI Studio
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(SECTOR_PROMPTS) as Array<keyof typeof SECTOR_PROMPTS>).map((sector) => (
            <div key={sector}>
              <h3 className="text-sm font-medium text-foreground capitalize mb-2">{sector}</h3>
              <div className="flex flex-wrap gap-2">
                {SECTOR_PROMPTS[sector].map((item) => (
                  <Button
                    key={item.label}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-left whitespace-normal"
                    asChild
                  >
                    <Link
                      href={`/dashboard/ai-studio?prompt=${encodeURIComponent(item.prompt)}`}
                      title={item.prompt}
                    >
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Create collection modal */}
      <Dialog open={createCollectionOpen} onOpenChange={setCreateCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle collection</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nom de la collection"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="bg-background"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCollectionOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                setNewCollectionName('');
                setCreateCollectionOpen(false);
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
