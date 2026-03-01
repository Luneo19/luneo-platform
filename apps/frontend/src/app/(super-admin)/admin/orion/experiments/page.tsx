'use client';

import React, { useState } from 'react';
import { Beaker, Plus, BarChart3, Calendar, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExperiments, type Experiment } from '@/hooks/admin/use-experiments';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: 'bg-blue-600/60 text-white border-0',
    completed: 'bg-emerald-600/60 text-white border-0',
    draft: 'bg-zinc-600 text-zinc-300 border-0',
  };
  const cls = map[status] ?? 'bg-zinc-600 text-zinc-300 border-0';
  return <Badge className={cls}>{status}</Badge>;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ExperimentCard({ exp }: { exp: Experiment }) {
  const variants = Array.isArray(exp.variants) ? exp.variants : [];
  const variantLabels = variants
    .map((v) => {
      const name = (v as { name?: string }).name ?? 'Variant';
      const split = (v as { split?: number }).split;
      return split != null ? `${name} ${split}%` : name;
    })
    .join(' · ');
  const startDate = exp.startDate ?? null;
  const endDate = exp.endDate ?? null;
  const duration = startDate && endDate
    ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
    : '—';

  return (
    <Card className="bg-zinc-800/80 border-zinc-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-zinc-100 text-lg">{exp.name}</CardTitle>
            <CardDescription className="text-zinc-400 text-sm mt-1">
              {exp.description ?? '—'}
            </CardDescription>
          </div>
          <StatusBadge status={exp.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
            <FlaskConical className="h-3 w-3 mr-1" />
            {exp.type ?? 'A/B'}
          </Badge>
          {variantLabels && (
            <span className="text-zinc-400">{variantLabels}</span>
          )}
        </div>
        <div className="grid gap-2 text-sm">
          {exp.targetAudience && (
            <div className="flex items-center gap-2 text-zinc-400">
              <BarChart3 className="h-4 w-4 text-zinc-500" />
              <span>Audience: {exp.targetAudience}</span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 text-zinc-500 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Start: {formatDate(startDate)}
            </span>
            <span>Duration: {duration}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          {exp.status === 'draft' && (
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Start experiment
            </Button>
          )}
          {exp.status === 'running' && (
            <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300">
              View results
            </Button>
          )}
          {exp.status === 'completed' && (
            <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300">
              View report
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExperimentsPage() {
  const { experiments, isLoading, isError } = useExperiments();
  const safeExperiments = Array.isArray(experiments) ? experiments : [];
  const [activeTab, setActiveTab] = useState('active');

  const active = safeExperiments.filter((e) => e.status === 'running');
  const completed = safeExperiments.filter((e) => e.status === 'completed');
  const draft = safeExperiments.filter((e) => e.status === 'draft');

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
            <Beaker className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Experiments & A/B Testing</h1>
            <p className="text-zinc-400 text-sm">
              Create and manage experiments, variants, and results
            </p>
          </div>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      {isError && (
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="py-4 text-zinc-400">
            No data available. Experiments API is not available. Showing empty state.
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-zinc-800 border border-zinc-700">
          <TabsTrigger value="active" className="data-[state=active]:bg-zinc-700 text-zinc-200">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-zinc-700 text-zinc-200">
            Completed ({completed.length})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-zinc-700 text-zinc-200">
            Draft ({draft.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                Loading experiments…
              </CardContent>
            </Card>
          ) : active.length === 0 ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                No active experiments. Create one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                Loading experiments…
              </CardContent>
            </Card>
          ) : completed.length === 0 ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                No completed experiments.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {isLoading ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                Loading experiments…
              </CardContent>
            </Card>
          ) : draft.length === 0 ? (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="py-12 text-center text-zinc-400">
                No draft experiments.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {draft.map((exp) => (
                <ExperimentCard key={exp.id} exp={exp} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
