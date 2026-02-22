'use client';

/**
 * API Keys Management Page
 * Developer-facing API key management similar to Stripe/OpenAI
 * - List existing keys with prefix, masked key, dates, status
 * - Create new key with name, permissions, rate limit
 * - Key display after creation (copy, one-time warning)
 * - Revoke/Delete with confirmation
 * - Usage statistics per key
 * - Documentation links
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Key,
  Copy,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Loader2,
  BarChart3,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { endpoints } from '@/lib/api/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { formatDate, formatRelativeDate, formatNumber } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  brandId: string;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

interface CreateApiKeyResponse {
  apiKey: ApiKey;
  secret: string;
}

interface UsageStats {
  requests: number;
  errors: number;
  rateLimitHits: number;
  period: string;
}

const PERMISSION_OPTIONS = [
  { id: '*', label: 'Full access (all permissions)', description: 'Unrestricted access to all API endpoints' },
  { id: 'read', label: 'Read', description: 'Read access to resources' },
  { id: 'write', label: 'Write', description: 'Create and update resources' },
  { id: 'design:generate', label: 'Design: Generate', description: 'Generate AI designs' },
  { id: 'design:read', label: 'Design: Read', description: 'Read design data' },
  { id: 'orders:read', label: 'Orders: Read', description: 'Read order data' },
  { id: 'products:read', label: 'Products: Read', description: 'Read product catalog' },
  { id: 'products:write', label: 'Products: Write', description: 'Manage products' },
];

const RATE_LIMIT_PRESETS = [
  { id: 'standard', label: 'Standard', rpm: 60, rpd: 10000, rpmn: 300000 },
  { id: 'elevated', label: 'Elevated', rpm: 120, rpd: 50000, rpmn: 1000000 },
  { id: 'high', label: 'High volume', rpm: 300, rpd: 100000, rpmn: 3000000 },
];

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••••••••••';
  const prefix = key.substring(0, 8);
  return `${prefix}••••••••••••${key.slice(-4)}`;
}

// ========================================
// COMPONENT
// ========================================

function ApiKeysPageContent() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showKeyDisplayModal, setShowKeyDisplayModal] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    permissions: ['read'] as string[],
    rateLimitPreset: 'standard',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
      requestsPerMonth: 300000,
    },
  });
  const [usagePeriod, setUsagePeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);

  // Fetch API keys
  const {
    data: apiKeys,
    isLoading: isLoadingKeys,
    isError: isKeysError,
    error: keysError,
    refetch: refetchKeys,
  } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: async (): Promise<ApiKey[]> => {
      const response = await endpoints.publicApi.keys.list();
      const raw = (response as { data?: ApiKey[] })?.data;
      return Array.isArray(raw) ? raw : (Array.isArray(response) ? (response as ApiKey[]) : []);
    },
  });

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      permissions: string[];
      rateLimit: { requestsPerMinute: number; requestsPerDay: number; requestsPerMonth: number };
    }) => {
      const response = await endpoints.publicApi.keys.create(data);
      return (response as CreateApiKeyResponse) ?? response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowCreateModal(false);
      setNewlyCreatedKey(data);
      setShowKeyDisplayModal(true);
      setCreateForm({
        name: '',
        permissions: ['read'],
        rateLimitPreset: 'standard',
        rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000, requestsPerMonth: 300000 },
      });
      toast({
        title: t('integrations.apiKeyRegenerated') || 'API key created',
        description: t('integrations.apiKeyRegeneratedDesc') || 'Your new API key has been created. Copy it now—you won\'t see it again.',
      });
    },
    onError: (error: unknown) => {
      logger.error('Failed to create API key', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    },
  });

  // Delete API key mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await endpoints.publicApi.keys.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setShowDeleteModal(false);
      setKeyToDelete(null);
      toast({
        title: 'API key revoked',
        description: 'The API key has been permanently deleted.',
      });
    },
    onError: (error: unknown) => {
      logger.error('Failed to delete API key', { error });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (key: ApiKey) => {
    setKeyToDelete(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (keyToDelete) {
      deleteMutation.mutate(keyToDelete.id);
    }
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your API key.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate({
      name: createForm.name.trim(),
      permissions: createForm.permissions.length ? createForm.permissions : ['read'],
      rateLimit: createForm.rateLimit,
    });
  };

  const togglePermission = (permissionId: string) => {
    if (permissionId === '*') {
      setCreateForm((prev) => ({
        ...prev,
        permissions: prev.permissions.includes('*') ? [] : ['*'],
      }));
      return;
    }
    setCreateForm((prev) => {
      const has = prev.permissions.includes(permissionId);
      const newPerms = has
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions.filter((p) => p !== '*'), permissionId];
      return { ...prev, permissions: newPerms };
    });
  };

  const setRateLimitPreset = (presetId: string) => {
    const preset = RATE_LIMIT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCreateForm((prev) => ({
        ...prev,
        rateLimitPreset: presetId,
        rateLimit: {
          requestsPerMinute: preset.rpm,
          requestsPerDay: preset.rpd,
          requestsPerMonth: preset.rpmn,
        },
      }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('common.copied') || 'Copied',
      description: 'API key copied to clipboard.',
    });
  };

  const getFullKey = () => {
    if (!newlyCreatedKey) return '';
    return `${newlyCreatedKey.apiKey.key}:${newlyCreatedKey.secret}`;
  };

  const closeKeyDisplayModal = () => {
    setShowKeyDisplayModal(false);
    setNewlyCreatedKey(null);
  };

  return (
    <ErrorBoundary level="page" componentName="ApiKeysPage">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Key className="w-8 h-8 text-cyan-400" />
                API Keys
              </h1>
              <p className="text-white/60 mt-1">
                Manage your API keys for programmatic access to the Luneo API.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.open('/help/documentation/api', '_blank')}
                className="border-white/20 hover:bg-white/5"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                API Documentation
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Key
              </Button>
            </div>
          </div>
        </div>

        {/* Documentation Card */}
        <Card className="mb-8 border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Using your API key</h3>
                <p className="text-white/60 text-sm mb-4">
                  Include your API key in request headers using <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-xs">X-API-Key: your_key</code> or{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono text-xs">Authorization: Bearer your_key</code>. Never expose your key in client-side code.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/help/documentation/api', '_blank')}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    API Reference
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/help/documentation/api#quickstart', '_blank')}
                    className="border-white/20 hover:bg-white/5"
                  >
                    Quick Start Guide
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keys Table */}
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-white">Your API Keys</CardTitle>
                <CardDescription className="text-white/60">
                  Keys are scoped to your account. Revoke any key you no longer need.
                </CardDescription>
              </div>
              {apiKeys && apiKeys.length > 0 && (
                <Select value={usagePeriod} onValueChange={(v) => setUsagePeriod(v as '24h' | '7d' | '30d')}>
                  <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Usage period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingKeys ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : isKeysError ? (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">
                  {keysError instanceof Error ? keysError.message : 'Failed to load API keys'}
                </p>
                <Button variant="outline" onClick={() => refetchKeys()} className="border-white/20">
                  {t('common.retry')}
                </Button>
              </div>
            ) : !apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-16">
                <Key className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No API keys yet</h3>
                <p className="text-white/60 mb-6 max-w-md mx-auto">
                  Create an API key to get started with the Luneo API. Use it to authenticate requests from your applications.
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first API key
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-white/60">Name</TableHead>
                      <TableHead className="text-white/60">Key</TableHead>
                      <TableHead className="text-white/60">Created</TableHead>
                      <TableHead className="text-white/60">Last used</TableHead>
                      <TableHead className="text-white/60">Status</TableHead>
                      <TableHead className="text-white/60">Rate limit</TableHead>
                      <TableHead className="text-white/60 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <ApiKeyRow
                        key={key.id}
                        apiKey={key}
                        usagePeriod={usagePeriod}
                        expandedKeyId={expandedKeyId}
                        onExpand={() => setExpandedKeyId(expandedKeyId === key.id ? null : key.id)}
                        onDelete={() => handleDelete(key)}
                        onCopy={copyToClipboard}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with a name and optional permissions. You can restrict access by scope.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g. Production server, staging"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-gray-700 p-3">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <div
                      key={perm.id}
                      className={cn(
                        'flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors',
                        createForm.permissions.includes(perm.id) ? 'bg-cyan-500/10' : 'hover:bg-white/5'
                      )}
                      onClick={() => togglePermission(perm.id)}
                    >
                      <Checkbox
                        checked={createForm.permissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{perm.label}</p>
                        <p className="text-xs text-gray-400">{perm.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Rate limit</Label>
                <Select value={createForm.rateLimitPreset} onValueChange={setRateLimitPreset}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATE_LIMIT_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label} — {preset.rpm}/min, {formatNumber(preset.rpd)}/day
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-gray-600">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create key'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Key Display Modal (shown once after creation) */}
        <Dialog open={showKeyDisplayModal} onOpenChange={(open) => !open && closeKeyDisplayModal()}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Copy your API key now
              </DialogTitle>
              <DialogDescription>
                For security reasons, we won't show this key again. Store it securely and never share it publicly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-200 mb-2">
                  This is the only time you'll see your secret. Copy it now.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all px-3 py-2 rounded bg-gray-800 text-cyan-300 font-mono text-sm">
                    {getFullKey()}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(getFullKey())}
                    className="bg-cyan-600 hover:bg-cyan-700 shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={closeKeyDisplayModal} className="bg-cyan-600 hover:bg-cyan-700">
                I've copied the key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={(open) => !open && setShowDeleteModal(false)}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Revoke API key</DialogTitle>
              <DialogDescription>
                Are you sure you want to revoke this API key? Any applications using it will immediately lose access. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {keyToDelete && (
              <div className="py-4">
                <p className="text-white font-medium">{keyToDelete.name}</p>
                <p className="text-white/60 text-sm font-mono mt-1">{maskKey(keyToDelete.key)}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="border-gray-600">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke key
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
}

// ========================================
// API KEY ROW (with usage stats)
// ========================================

function ApiKeyRow({
  apiKey,
  usagePeriod,
  expandedKeyId,
  onExpand,
  onDelete,
  onCopy,
}: {
  apiKey: ApiKey;
  usagePeriod: '24h' | '7d' | '30d';
  expandedKeyId: string | null;
  onExpand: () => void;
  onDelete: () => void;
  onCopy: (text: string) => void;
}) {
  const { data: usage, isLoading: isLoadingUsage } = useQuery<UsageStats>({
    queryKey: ['api-key-usage', apiKey.id, usagePeriod],
    queryFn: () => endpoints.publicApi.keys.getUsage(apiKey.id, usagePeriod),
    enabled: expandedKeyId === apiKey.id,
  });

  const isExpanded = expandedKeyId === apiKey.id;

  return (
    <>
      <TableRow className="border-white/10 hover:bg-white/[0.02]">
        <TableCell className="font-medium text-white">{apiKey.name}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <code className="font-mono text-sm text-white/80">{maskKey(apiKey.key)}</code>
          </div>
        </TableCell>
        <TableCell className="text-white/60 text-sm">
          {formatDate(apiKey.createdAt)}
        </TableCell>
        <TableCell className="text-white/60 text-sm">
          {apiKey.lastUsedAt ? formatRelativeDate(apiKey.lastUsedAt) : 'Never'}
        </TableCell>
        <TableCell>
          <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className={apiKey.isActive ? 'bg-green-600' : 'bg-white/10'}>
            {apiKey.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
        <TableCell className="text-white/60 text-sm">
          {apiKey.rateLimit?.requestsPerMinute ?? 60}/min
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExpand()}
              className="text-white/60 hover:text-white"
              title="Usage stats"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete()}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              title="Revoke key"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-white/10 bg-white/[0.02]">
          <TableCell colSpan={7} className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-4 border-l-2 border-cyan-500/30">
              <div>
                <h4 className="text-sm font-medium text-white mb-2">Usage statistics</h4>
                {isLoadingUsage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                ) : usage ? (
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs text-white/60">Requests</p>
                      <p className="text-lg font-semibold text-white">{formatNumber(usage.requests)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Errors</p>
                      <p className="text-lg font-semibold text-white">{formatNumber(usage.errors)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Rate limit hits</p>
                      <p className="text-lg font-semibold text-white">{formatNumber(usage.rateLimitHits)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/60 text-sm">No usage data for this period</p>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ========================================
// EXPORT
// ========================================

export default function ApiKeysPage() {
  return <ApiKeysPageContent />;
}
