/**
 * ★★★ ADMIN WEBHOOKS PAGE ★★★
 * Page pour gérer les webhooks
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Webhook, CheckCircle, XCircle, Clock, MoreVertical, Play, Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Webhook {
  id: string;
  url: string;
  eventTypes: string[];
  status: 'active' | 'paused' | 'failed';
  description?: string | null;
  createdAt: Date | string;
  _count?: {
    logs: number;
  };
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<{ webhooks?: unknown[] }>('/api/v1/admin/webhooks');
      setWebhooks((data?.webhooks ?? []) as Webhook[]);
    } catch (error) {
      logger.error('Error loading webhooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async (webhookId: string) => {
    try {
      const data = await api.post<{ success?: boolean; response?: string }>(`/api/v1/admin/webhooks/${webhookId}/test`, {});
      if (data?.success) {
        alert('Webhook test successful!');
      } else {
        alert(`Webhook test failed: ${(data as { response?: string })?.response ?? 'Unknown'}`);
      }
      loadWebhooks();
    } catch (error) {
      logger.error('Error testing webhook:', error);
      alert('Failed to test webhook');
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await api.delete(`/api/v1/admin/webhooks/${webhookId}`);
      loadWebhooks();
    } catch (error) {
      logger.error('Error deleting webhook:', error);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    failed: 'bg-red-500/20 text-red-400',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    active: <CheckCircle className="w-4 h-4" />,
    paused: <Clock className="w-4 h-4" />,
    failed: <XCircle className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Webhooks</h1>
          <p className="text-zinc-400 mt-2">
            Manage inbound and outbound webhooks
          </p>
        </div>
        <Link href="/admin/webhooks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Webhook
          </Button>
        </Link>
      </div>

      {/* Webhooks Table */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Webhooks ({webhooks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-700 rounded animate-pulse" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No webhooks configured</p>
              <Link href="/admin/webhooks/new">
                <Button>Create First Webhook</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="text-zinc-400">URL</TableHead>
                  <TableHead className="text-zinc-400">Events</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Logs</TableHead>
                  <TableHead className="text-zinc-400">Created</TableHead>
                  <TableHead className="text-zinc-400 w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id} className="border-zinc-700">
                    <TableCell>
                      <div>
                        <div className="text-white font-medium">{webhook.url}</div>
                        {webhook.description && (
                          <div className="text-sm text-zinc-400">{webhook.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.eventTypes.slice(0, 3).map((event) => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                        {webhook.eventTypes.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{webhook.eventTypes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', statusColors[webhook.status])}
                      >
                        <span className="flex items-center gap-1">
                          {statusIcons[webhook.status]}
                          {webhook.status.charAt(0).toUpperCase() + webhook.status.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {webhook._count?.logs || 0}
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {new Date(webhook.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTest(webhook.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Test
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(webhook.id)}
                            className="text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
