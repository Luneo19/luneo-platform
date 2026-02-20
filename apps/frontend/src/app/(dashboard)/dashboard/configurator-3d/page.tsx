/**
 * 3D Configurator - Main List Page
 * ConfigurationListPage - List all 3D configurations with filters, search, pagination
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  Trash2,
  ExternalLink,
  Box,
  Loader2,
} from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig, ConfiguratorStatus } from '@/lib/configurator-3d/types/configurator.types';
import Image from 'next/image';

interface ConfigListItem extends Configurator3DConfig {
  _count?: { sessions?: number };
  sessionCount?: number;
  conversionCount?: number;
}

interface ListResponse {
  data?: ConfigListItem[];
  configurations?: ConfigListItem[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

function ConfigurationListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, error } = useQuery({
    queryKey: ['configurator3d', 'configurations', page, limit, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await configurator3dEndpoints.configurations.list<ListResponse>(params);
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => configurator3dEndpoints.configurations.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'configurations'] });
      toast({ title: 'Configuration deleted' });
    },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => configurator3dEndpoints.configurations.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'configurations'] });
      toast({ title: 'Configuration published' });
    },
    onError: () => toast({ title: 'Failed to publish', variant: 'destructive' }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => configurator3dEndpoints.configurations.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'configurations'] });
      toast({ title: 'Configuration unpublished' });
    },
    onError: () => toast({ title: 'Failed to unpublish', variant: 'destructive' }),
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => configurator3dEndpoints.configurations.clone(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configurator3d', 'configurations'] });
      toast({ title: 'Configuration cloned' });
      if (data && typeof data === 'object' && 'id' in data) {
        router.push(`/dashboard/configurator-3d/${(data as { id: string }).id}`);
      }
    },
    onError: () => toast({ title: 'Failed to clone', variant: 'destructive' }),
  });

  const items = (data && (Array.isArray(data) ? data : (data as ListResponse).data ?? (data as ListResponse).configurations)) ?? [];
  const meta = data && typeof data === 'object' && 'meta' in data ? (data as ListResponse).meta : undefined;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? items.length;

  const getStatusBadge = (status: ConfiguratorStatus) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      ARCHIVED: 'outline',
    };
    return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
  };

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '-');

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load configurations. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">3D Configurations</h1>
          <p className="text-muted-foreground">Manage your 3D product configurators</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/configurator-3d/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Configuration
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search configurations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="JEWELRY">Jewelry</SelectItem>
            <SelectItem value="WATCH">Watch</SelectItem>
            <SelectItem value="EYEWEAR">Eyewear</SelectItem>
            <SelectItem value="FURNITURE">Furniture</SelectItem>
            <SelectItem value="APPAREL">Apparel</SelectItem>
            <SelectItem value="ACCESSORIES">Accessories</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('table')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Box className="h-16 w-16" />}
          title="No configurations yet"
          description="Create your first 3D configurator to let customers customize products in real-time."
          action={{
            label: 'Create New Configuration',
            onClick: () => router.push('/dashboard/configurator-3d/new'),
          }}
        />
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <Link href={`/dashboard/configurator-3d/${item.id}`}>
                  <div className="aspect-video bg-muted relative">
                    {item.thumbnailUrl ? (
                      <Image src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" width={200} height={200} unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Box className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1">
                      {getStatusBadge(item.status)}
                      <Badge variant="outline">{item.type}</Badge>
                    </div>
                  </div>
                </Link>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/configurator-3d/${item.id}`}>
                        <h3 className="font-semibold truncate hover:underline">{item.name}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item._count?.sessions ?? item.sessionCount ?? 0} sessions · {(item as { conversionCount?: number }).conversionCount ?? 0} conversions
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(item.metadata?.createdAt as string ?? (item as { createdAt?: string }).createdAt)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/configurator-3d/${item.id}/edit`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/configurator-3d/${item.id}/preview`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        {item.status === 'PUBLISHED' ? (
                          <DropdownMenuItem onClick={() => unpublishMutation.mutate(item.id)}>
                            Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => cloneMutation.mutate(item.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Delete this configuration?')) deleteMutation.mutate(item.id);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={`/dashboard/configurator-3d/${item.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item._count?.sessions ?? item.sessionCount ?? 0}</TableCell>
                    <TableCell>{(item as { conversionCount?: number }).conversionCount ?? 0}</TableCell>
                    <TableCell>{formatDate((item as { createdAt?: string }).createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/configurator-3d/${item.id}/edit`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/configurator-3d/${item.id}/preview`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/configurator-3d/${item.id}`)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {item.status === 'PUBLISHED' ? (
                            <DropdownMenuItem onClick={() => unpublishMutation.mutate(item.id)}>Unpublish</DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => publishMutation.mutate(item.id)}>Publish</DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => cloneMutation.mutate(item.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Clone
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Delete this configuration?')) deleteMutation.mutate(item.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Configurator3DListPage() {
  return (
    <div className="min-h-screen bg-background">
      <ConfigurationListPage />
    </div>
  );
}
