'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Loader2,
  Image as ImageIcon,
  BarChart3,
  Users,
  ShoppingCart,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

function CustomizerListContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 20;

  const { data, isLoading, error } = api.visualCustomizer.customizer.list.useQuery({
    page,
    limit,
    search: search || undefined,
    type: typeFilter !== 'all' ? (typeFilter.toUpperCase() as 'TEMPLATE' | 'PRODUCT' | 'CANVAS') : undefined,
    status: statusFilter !== 'all' ? (statusFilter as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') : undefined,
  });

  const customizers = data?.customizers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const deleteMutation = api.visualCustomizer.customizer.delete.useMutation();
  const createMutation = api.visualCustomizer.customizer.create.useMutation();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customizer?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: 'Customizer deleted successfully' });
      // Refetch data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to delete customizer',
        variant: 'destructive',
      });
    }
  };

  const handleClone = async (id: string) => {
    try {
      const customizer = (customizers as Record<string, unknown>[]).find((c) => (c.id as string) === id);
      if (!customizer) return;

      const rawType = (customizer as { type?: string }).type ?? 'product';
      const typeUpper = (typeof rawType === 'string' ? rawType.toUpperCase() : 'PRODUCT') as 'TEMPLATE' | 'PRODUCT' | 'CANVAS';
      const cloned = (await createMutation.mutateAsync({
        name: `${(customizer as { name?: string }).name ?? 'Customizer'} (Copy)`,
        description: (customizer as { description?: string }).description,
        type: typeUpper,
        productId: (customizer as { productId?: string }).productId,
        config: (customizer as { config?: unknown }).config as Record<string, unknown> | undefined,
      })) as Record<string, unknown>;

      toast({ title: 'Customizer cloned successfully' });
      router.push(`/dashboard/customizer/${cloned?.id ?? id}`);
    } catch (error) {
      toast({
        title: 'Failed to clone customizer',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load customizers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Visual Customizer</h1>
          <p className="text-muted-foreground">Create and manage visual customizers for your products</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customizer/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customizers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="template">Template</SelectItem>
            <SelectItem value="canvas">Canvas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Customizers Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : customizers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customizers found</h3>
            <p className="text-muted-foreground mb-4 text-center">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first customizer'}
            </p>
            {!search && typeFilter === 'all' && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/dashboard/customizer/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Customizer
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(customizers as Record<string, unknown>[]).map((customizer: Record<string, unknown>) => {
              const id = customizer.id as string;
              const name = (customizer.name as string) ?? 'Unnamed';
              const status = (customizer.status as string) ?? 'DRAFT';
              const type = (customizer.type as string) ?? 'product';
              const thumbnail = (customizer.thumbnailUrl as string) || (customizer.previewImageUrl as string);
              const sessions = (customizer.sessionCount as number) ?? 0;
              const designs = (customizer.savedDesignCount as number) ?? 0;
              const conversions = (customizer.conversionCount as number) ?? 0;

              return (
                <Card key={id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <Link href={`/dashboard/customizer/${id}`}>
                      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                        {thumbnail ? (
                          <Image width={200} height={200}
                            src={thumbnail}
                            alt={name}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          unoptimized />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={
                              status === 'PUBLISHED'
                                ? 'default'
                                : status === 'ARCHIVED'
                                  ? 'outline'
                                  : 'secondary'
                            }
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Link href={`/dashboard/customizer/${id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors">{name}</h3>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/customizer/${id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/customizer/${id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleClone(id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 capitalize">{type}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{sessions}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ImageIcon className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{designs}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{conversions}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} customizers
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CustomizerPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizerPage">
      <CustomizerListContent />
    </ErrorBoundary>
  );
}
