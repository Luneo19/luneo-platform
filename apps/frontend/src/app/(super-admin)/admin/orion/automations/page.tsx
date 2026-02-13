'use client';

/**
 * ORION Automations Manager
 */
import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Zap,
  ArrowLeft,
  Play,
  Pause,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  Mail,
  Loader2,
} from 'lucide-react';

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

type AutomationStatus = 'ACTIVE' | 'DRAFT' | 'PAUSED';

type Automation = {
  id: string;
  name: string;
  status: AutomationStatus;
  triggerType?: string;
  description?: string | null;
  triggeredCount?: number;
  completedCount?: number;
  conversionRate?: number | null;
  createdAt?: string;
};

function formatDate(d: string | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusBadgeClass(status: AutomationStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'PAUSED':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default:
      return 'bg-zinc-600/50 text-zinc-300 border-zinc-500/50';
  }
}

const TRIGGER_TYPES = [
  { value: 'signup', label: 'Signup' },
  { value: 'trial_ending', label: 'Trial Ending' },
  { value: 'low_credits', label: 'Low Credits' },
  { value: 'inactive', label: 'Inactive User' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'custom', label: 'Custom' },
];

export default function OrionAutomationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createTriggerType, setCreateTriggerType] = useState('signup');
  const [createDescription, setCreateDescription] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    data: automations,
    error,
    isLoading,
    mutate,
  } = useSWR<Automation[] | { error?: string }>(
    '/api/admin/orion/automations',
    fetcher,
    { revalidateOnFocus: false }
  );

  const list: Automation[] = Array.isArray(automations) ? automations : [];
  const hasError = !!error || (!isLoading && automations && !Array.isArray(automations));
  const noData = !isLoading && !hasError && list.length === 0;

  const totalAutomations = list.length;
  const activeCount = list.filter((a) => a.status === 'ACTIVE').length;
  const totalTriggered = list.reduce((sum, a) => sum + (a.triggeredCount ?? 0), 0);
  const rates = list
    .filter((a) => a.conversionRate != null && !Number.isNaN(Number(a.conversionRate)))
    .map((a) => Number(a.conversionRate));
  const avgConversion =
    rates.length > 0 ? (rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(1) : '—';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) {
      setCreateError('Name is required');
      return;
    }
    setCreateError(null);
    setCreateSubmitting(true);
    try {
      const res = await fetch('/api/admin/orion/automations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          triggerType: createTriggerType,
          description: createDescription.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const raw = await res.json().catch(() => ({}));
        throw new Error(raw.error ?? 'Failed to create');
      }
      setCreateName('');
      setCreateTriggerType('signup');
      setCreateDescription('');
      setShowCreateForm(false);
      mutate();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create automation');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleToggleStatus = async (a: Automation) => {
    const nextStatus = a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setTogglingId(a.id);
    try {
      const res = await fetch(`/api/admin/orion/automations/${a.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update');
      mutate();
    } catch {
      // silent fail or toast in real app
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/orion">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber-400" />
              Automations Manager
            </h1>
            <p className="mt-1 text-zinc-400">
              Configure and manage ORION automations
            </p>
          </div>
        </div>
        {!showCreateForm && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create
          </Button>
        )}
      </div>

      {showCreateForm && (
        <Card className="border-zinc-700 bg-zinc-800/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg text-white">New automation</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
              onClick={() => {
                setShowCreateForm(false);
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Name</Label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Welcome sequence"
                  className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Trigger type</Label>
                <Select value={createTriggerType} onValueChange={setCreateTriggerType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-600">
                    {TRIGGER_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-white focus:bg-zinc-700">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Description (optional)</Label>
                <Input
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Short description"
                  className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                />
              </div>
              {createError && (
                <p className="text-sm text-red-400">{createError}</p>
              )}
              <Button
                type="submit"
                disabled={createSubmitting}
                className="bg-zinc-700 text-white hover:bg-zinc-600"
              >
                {createSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create automation
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Automations</CardTitle>
            <Zap className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-white">{totalAutomations}</span>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-white">{activeCount}</span>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Triggered</CardTitle>
            <BarChart3 className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-white">{totalTriggered}</span>
          </CardContent>
        </Card>
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Avg Conversion Rate</CardTitle>
            <Mail className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-white">{avgConversion}{typeof avgConversion === 'string' && avgConversion !== '—' ? '%' : ''}</span>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      )}

      {hasError && !isLoading && (
        <Card className="border-zinc-700 bg-zinc-800/80">
          <CardContent className="py-6 text-center text-zinc-400">
            Failed to load automations. The API may be unavailable.
          </CardContent>
        </Card>
      )}

      {noData && !showCreateForm && (
        <Card className="border-zinc-700 bg-zinc-800/80">
          <CardContent className="py-12 text-center">
            <p className="text-zinc-400 mb-4">No automations configured yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-zinc-700 text-white hover:bg-zinc-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create automation
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !hasError && list.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Automation list</h2>
          <div className="grid gap-4">
            {list.map((a) => (
              <Card key={a.id} className="border-zinc-700 bg-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-medium text-white">
                      {a.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={statusBadgeClass(a.status)}
                    >
                      {a.status}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                    onClick={() => handleToggleStatus(a)}
                    disabled={togglingId === a.id || a.status === 'DRAFT'}
                  >
                    {togglingId === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : a.status === 'ACTIVE' ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                    <span>Trigger: {a.triggerType ?? '—'}</span>
                    {a.description && (
                      <span className="text-zinc-500">· {a.description}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-zinc-400">
                      Triggered: <span className="text-white font-medium">{a.triggeredCount ?? 0}</span>
                    </span>
                    <span className="text-zinc-400">
                      Completed: <span className="text-white font-medium">{a.completedCount ?? 0}</span>
                    </span>
                    <span className="text-zinc-400">
                      Conversion: <span className="text-white font-medium">
                        {a.conversionRate != null ? `${Number(a.conversionRate).toFixed(1)}%` : '—'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    Created {formatDate(a.createdAt)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
