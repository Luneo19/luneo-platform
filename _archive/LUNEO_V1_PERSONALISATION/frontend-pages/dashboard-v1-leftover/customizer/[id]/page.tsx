'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Pencil,
  Eye,
  Trash2,
  Copy,
  Code2,
  Settings,
  BarChart3,
  Loader2,
  MousePointer,
  Users,
  ShoppingCart,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Package,
  Shield,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const TAB_NAVIGATION = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'zones', label: 'Zones', icon: Layers },
  { id: 'presets', label: 'Presets', icon: Package },
  { id: 'assets', label: 'Assets', icon: ImageIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'embed', label: 'Embed', icon: Code2 },
];

function CustomizerDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const { data: customizer, isLoading, error } = api.visualCustomizer.customizer.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  const { data: sessionsData } = api.visualCustomizer.sessions.list.useQuery(
    { customizerId: id, limit: 5 },
    { enabled: !!id }
  );

  const sessions = sessionsData?.sessions ?? [];

  const deleteMutation = api.visualCustomizer.customizer.delete.useMutation();
  const updateMutation = api.visualCustomizer.customizer.update.useMutation();
  const createMutation = api.visualCustomizer.customizer.create.useMutation();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this customizer?')) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: 'Customizer deleted successfully' });
      router.push('/dashboard/customizer');
    } catch {
      toast({
        title: 'Failed to delete customizer',
        variant: 'destructive',
      });
    }
  };

  const publishMutation = api.visualCustomizer.customizer.publish.useMutation();

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync({ id });
      toast({ title: 'Customizer published successfully' });
    } catch {
      toast({
        title: 'Failed to publish customizer',
        variant: 'destructive',
      });
    }
  };

  const handleClone = async () => {
    if (!customizer) return;
    try {
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
    } catch {
      toast({
        title: 'Failed to clone customizer',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !customizer) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load customizer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const name = (customizer as { name?: string }).name ?? 'Unnamed';
  const status = (customizer as { status?: string }).status ?? 'DRAFT';
  const description = (customizer as { description?: string }).description;
  const thumbnail = (customizer as { thumbnailUrl?: string }).thumbnailUrl || (customizer as { previewImageUrl?: string }).previewImageUrl;

  const stats = [
    {
      label: 'Sessions',
      value: (customizer as { sessionCount?: number }).sessionCount ?? 0,
      icon: Users,
    },
    {
      label: 'Saved Designs',
      value: (customizer as { savedDesignCount?: number }).savedDesignCount ?? 0,
      icon: ImageIcon,
    },
    {
      label: 'Exports',
      value: (customizer as { exportCount?: number }).exportCount ?? 0,
      icon: MousePointer,
    },
    {
      label: 'Conversions',
      value: (customizer as { conversionCount?: number }).conversionCount ?? 0,
      icon: ShoppingCart,
    },
    {
      label: 'Revenue',
      value: `${(customizer as { revenue?: number }).revenue ?? 0} EUR`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{name}</h1>
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
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        <div className="flex gap-2">
          {status !== 'PUBLISHED' && (
            <Button size="sm" onClick={handlePublish}>
              Publish
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/customizer/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleClone}>
            <Copy className="mr-2 h-4 w-4" />
            Clone
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/customizer/${id}/embed`}>
              <Code2 className="mr-2 h-4 w-4" />
              Embed
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/customizer/${id}/settings`}>Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          {TAB_NAVIGATION.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} asChild>
                <Link href={`/dashboard/customizer/${id}/${tab.id === 'overview' ? '' : tab.id}`}>
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Link>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks for this customizer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" className="justify-start" asChild>
                      <Link href={`/dashboard/customizer/${id}/zones`}>
                        <Layers className="mr-2 h-4 w-4" />
                        Manage Zones
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link href={`/dashboard/customizer/${id}/presets`}>
                        <Package className="mr-2 h-4 w-4" />
                        Manage Presets
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link href={`/dashboard/customizer/${id}/assets`}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Manage Assets
                      </Link>
                    </Button>
                    <Button variant="outline" className="justify-start" asChild>
                      <Link href={`/dashboard/customizer/${id}/analytics`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Analytics
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Sessions</CardTitle>
                  <CardDescription>Latest customizer sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sessions yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(sessions as Record<string, unknown>[]).slice(0, 5).map((session: Record<string, unknown>) => (
                          <TableRow key={session.id as string}>
                            <TableCell className="font-mono text-xs">
                              {(session.id as string).slice(0, 8)}...
                            </TableCell>
                            <TableCell>{session.status as string}</TableCell>
                            <TableCell>
                              {session.startedAt
                                ? new Date(session.startedAt as string).toLocaleString()
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Customizer preview</CardDescription>
                </CardHeader>
                <CardContent>
                  {thumbnail ? (
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <Image width={200} height={200}
                        src={thumbnail}
                        alt={name}
                        className="h-full w-full object-cover"
                      unoptimized />
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded-lg bg-muted">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No preview</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                    <Link href={`/customize/${(customizer as { productId?: string }).productId ?? id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Live
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CustomizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ErrorBoundary level="page" componentName="CustomizerDetailPage">
      <CustomizerDetailContent params={params} />
    </ErrorBoundary>
  );
}
