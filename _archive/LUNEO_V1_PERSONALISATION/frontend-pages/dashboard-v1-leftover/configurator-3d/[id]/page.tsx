/**
 * Configuration Detail / Overview Page
 * Stats, quick links, recent sessions, mini 3D preview
 */

'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Pencil,
  Eye,
  Trash2,
  ExternalLink,
  Box,
  Settings,
  BarChart3,
  Code2,
  DollarSign,
  Users,
  MousePointer,
  Loader2,
  Package,
  GitBranch,
  ListChecks,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

const ThreeViewer = dynamic(() => import('@/components/ThreeViewer'), { ssr: false });

const QUICK_LINKS = [
  { href: 'components', label: 'Components', icon: Package },
  { href: 'options', label: 'Options', icon: ListChecks },
  { href: 'rules', label: 'Rules', icon: GitBranch },
  { href: 'pricing', label: 'Pricing', icon: DollarSign },
  { href: 'analytics', label: 'Analytics', icon: BarChart3 },
  { href: 'settings', label: 'Settings', icon: Settings },
  { href: 'embed', label: 'Embed', icon: Code2 },
];

export default function ConfigurationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig>(id),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['configurator3d', 'sessions', id],
    queryFn: () => configurator3dEndpoints.sessions.listAll<{ data?: { id: string; status: string; startedAt?: string }[] }>({ limit: 5 }),
  });

  const sessions = (sessionsData && Array.isArray(sessionsData) ? sessionsData : (sessionsData as { data?: unknown[] })?.data) ?? [];

  const deleteConfig = async () => {
    if (!confirm('Delete this configuration?')) return;
    try {
      await configurator3dEndpoints.configurations.delete(id);
      toast({ title: 'Configuration deleted' });
      window.location.href = '/dashboard/configurator-3d';
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const publishConfig = async () => {
    try {
      await configurator3dEndpoints.configurations.publish(id);
      toast({ title: 'Configuration published' });
    } catch {
      toast({ title: 'Failed to publish', variant: 'destructive' });
    }
  };

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load configuration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    { label: 'Views', value: (config as { viewCount?: number }).viewCount ?? 0, icon: MousePointer },
    { label: 'Sessions', value: (config as { sessionCount?: number }).sessionCount ?? 0, icon: Users },
    { label: 'Conversions', value: (config as { conversionCount?: number }).conversionCount ?? 0, icon: BarChart3 },
    { label: 'Revenue', value: `${(config as { revenue?: number }).revenue ?? 0} ${config.pricingSettings?.currency ?? 'EUR'}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{config.name}</h1>
            <Badge variant={config.status === 'PUBLISHED' ? 'default' : config.status === 'ARCHIVED' ? 'outline' : 'secondary'}>
              {config.status}
            </Badge>
          </div>
          {config.description && (
            <p className="mt-1 text-muted-foreground">{config.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}/preview`}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
          {config.status !== 'PUBLISHED' && (
            <Button size="sm" onClick={publishConfig}>
              Publish
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/configurator-3d/${id}/edit`}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/configurator-3d/${id}/preview`}>Preview</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={deleteConfig}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Navigate to configuration sections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUICK_LINKS.map((link) => (
                  <Button key={link.href} variant="outline" className="justify-start" asChild>
                    <Link href={`/dashboard/configurator-3d/${id}/${link.href}`}>
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Latest configurator sessions</CardDescription>
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
                    {(sessions as { id: string; status: string; startedAt?: string }[]).slice(0, 5).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}...</TableCell>
                        <TableCell>{s.status}</TableCell>
                        <TableCell>{s.startedAt ? new Date(s.startedAt).toLocaleString() : '-'}</TableCell>
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
              <CardTitle>3D Preview</CardTitle>
              <CardDescription>Model preview</CardDescription>
            </CardHeader>
            <CardContent>
              {config.modelUrl ? (
                <div className="aspect-square overflow-hidden rounded-lg">
                  <ThreeViewer modelUrl={config.modelUrl} height={280} />
                </div>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-muted">
                  <Box className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No model</p>
                </div>
              )}
              <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/dashboard/configurator-3d/${id}/preview`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Full Preview
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
