'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Search, Users, Package, TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBrands } from '@/hooks/admin/use-brands';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
  PENDING_VERIFICATION: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  VERIFIED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const planColors: Record<string, string> = {
  starter: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  professional: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  business: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  free: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function BrandsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const { brands, pagination, isLoading, isError, filters, updateFilters, goToPage, refresh } = useBrands();

  const handleSearch = (value: string) => {
    setSearch(value);
    updateFilters({ search: value });
  };

  // Calculate stats from brands
  const totalBrands = pagination.total;
  const activeBrands = brands.filter(b => b.status === 'ACTIVE').length;
  const trialBrands = brands.filter(b => b.subscriptionStatus === 'TRIALING').length;
  const enterpriseBrands = brands.filter(b => (b.subscriptionPlan || b.plan) === 'enterprise').length;

  if (isError) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement des marques</p>
            <Button variant="outline" onClick={() => refresh()} className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Brands</h1>
          <p className="text-zinc-400 mt-1">Gestion des marques et tenants de la plateforme</p>
        </div>
        <Button variant="outline" onClick={() => refresh()} className="border-zinc-700">
          Rafraîchir
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">Total Brands</p>
              <p className="text-2xl font-bold text-white">{isLoading ? '...' : totalBrands}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">Active</p>
              <p className="text-2xl font-bold text-white">{isLoading ? '...' : activeBrands}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><Users className="w-5 h-5 text-yellow-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">Trials</p>
              <p className="text-2xl font-bold text-white">{isLoading ? '...' : trialBrands}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Package className="w-5 h-5 text-amber-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">{t('admin.brands.enterprise')}</p>
              <p className="text-2xl font-bold text-white">{isLoading ? '...' : enterpriseBrands}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder={t('admin.brands.searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <Select value={filters.plan || 'all'} onValueChange={(v) => updateFilters({ plan: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder={t('admin.brands.plan')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.brands.allPlans')}</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status || 'all'} onValueChange={(v) => updateFilters({ status: v === 'all' ? '' : v })}>
            <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder={t('admin.brands.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.brands.allStatuses')}</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="TRIALING">Trial</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700 hover:bg-transparent">
              <TableHead className="text-zinc-400">{t('admin.brands.brand')}</TableHead>
              <TableHead className="text-zinc-400">{t('admin.brands.plan')}</TableHead>
              <TableHead className="text-zinc-400">{t('admin.brands.status')}</TableHead>
              <TableHead className="text-zinc-400 text-center">{t('admin.brands.users')}</TableHead>
              <TableHead className="text-zinc-400 text-center">{t('admin.brands.products')}</TableHead>
              <TableHead className="text-zinc-400">{t('admin.brands.usageAI')}</TableHead>
              <TableHead className="text-zinc-400">{t('admin.brands.createdAt')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-zinc-700">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-zinc-700 rounded animate-pulse w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : brands.length === 0 ? (
              <TableRow className="border-zinc-700">
                <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                  {t('admin.brands.noBrandsFound')}
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => {
                const plan = brand.subscriptionPlan || brand.plan || 'free';
                const aiUsagePercent = brand.maxMonthlyGenerations > 0
                  ? Math.round((brand.monthlyGenerations / brand.maxMonthlyGenerations) * 100)
                  : 0;
                return (
                  <TableRow key={brand.id} className="border-zinc-700 hover:bg-zinc-800/80">
                    <TableCell>
                      <Link href={`/admin/brands/${brand.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-sm font-bold text-white">
                          {(brand.name || 'B').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{brand.name}</p>
                          <p className="text-xs text-zinc-500">{brand.slug}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={planColors[plan] || planColors.free}>
                        {plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[brand.status] || statusColors.ACTIVE}>
                        {brand.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-zinc-300">{brand._count?.users ?? '-'}</TableCell>
                    <TableCell className="text-center text-zinc-300">{brand._count?.products ?? '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(aiUsagePercent, 100)}%` }} />
                        </div>
                        <span className="text-xs text-zinc-400">{aiUsagePercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(brand.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              {t('admin.brands.pageOf', { page: pagination.page, total: pagination.totalPages, count: pagination.total })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="border-zinc-700"
              >
                {t('admin.brands.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="border-zinc-700"
              >
                {t('admin.brands.next')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
