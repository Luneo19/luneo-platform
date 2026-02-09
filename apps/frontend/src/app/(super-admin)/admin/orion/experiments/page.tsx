'use client';

import React, { useState } from 'react';
import { Beaker, Plus, BarChart3, Calendar, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ExperimentStatus = 'running' | 'completed' | 'draft';

const MOCK_EXPERIMENTS = [
  {
    id: '1',
    name: 'Pricing page layout',
    description: 'Test new pricing table vs current layout',
    type: 'A/B',
    variants: [{ name: 'Control', split: 50 }, { name: 'New layout', split: 50 }],
    primaryMetric: 'Sign-up rate',
    results: 'B +12% (87% conf.)',
    startDate: '2025-01-15',
    duration: '21 days',
    status: 'running' as ExperimentStatus,
    confidence: '87%',
  },
  {
    id: '2',
    name: 'Onboarding steps',
    description: '3-step vs 5-step onboarding flow',
    type: 'A/B',
    variants: [{ name: '3 steps', split: 50 }, { name: '5 steps', split: 50 }],
    primaryMetric: 'Completion rate',
    results: 'A +8% (92% conf.)',
    startDate: '2024-12-01',
    duration: '14 days',
    status: 'completed' as ExperimentStatus,
    confidence: '92%',
  },
  {
    id: '3',
    name: 'CTA button color',
    description: 'Primary vs secondary CTA style',
    type: 'A/B',
    variants: [{ name: 'Primary', split: 50 }, { name: 'Secondary', split: 50 }],
    primaryMetric: 'Click-through',
    results: '-',
    startDate: '-',
    duration: '-',
    status: 'draft' as ExperimentStatus,
    confidence: '-',
  },
  {
    id: '4',
    name: 'Checkout copy',
    description: 'Short vs long reassurance copy',
    type: 'Multivariate',
    variants: [{ name: 'Short', split: 33 }, { name: 'Long', split: 34 }, { name: 'Control', split: 33 }],
    primaryMetric: 'Conversion',
    results: 'Running...',
    startDate: '2025-02-01',
    duration: '14 days',
    status: 'running' as ExperimentStatus,
    confidence: '45%',
  },
  {
    id: '5',
    name: 'Email subject line',
    description: 'Personalized vs generic subject',
    type: 'A/B',
    variants: [{ name: 'Generic', split: 50 }, { name: 'Personalized', split: 50 }],
    primaryMetric: 'Open rate',
    results: 'B +18% (95% conf.)',
    startDate: '2024-11-10',
    duration: '7 days',
    status: 'completed' as ExperimentStatus,
    confidence: '95%',
  },
];

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const map = {
    running: 'bg-blue-600/60 text-white border-0',
    completed: 'bg-emerald-600/60 text-white border-0',
    draft: 'bg-zinc-600 text-zinc-300 border-0',
  };
  return <Badge className={map[status]}>{status}</Badge>;
}

function ExperimentCard({ exp }: { exp: (typeof MOCK_EXPERIMENTS)[0] }) {
  return (
    <Card className="bg-zinc-800/80 border-zinc-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-zinc-100 text-lg">{exp.name}</CardTitle>
            <CardDescription className="text-zinc-400 text-sm mt-1">{exp.description}</CardDescription>
          </div>
          <StatusBadge status={exp.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="border-zinc-600 text-zinc-300">
            <FlaskConical className="h-3 w-3 mr-1" />
            {exp.type}
          </Badge>
          {exp.variants.map((v, i) => (
            <span key={i} className="text-zinc-400">
              {v.name} {v.split}%
              {i < exp.variants.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-zinc-400">
            <BarChart3 className="h-4 w-4 text-zinc-500" />
            <span>Primary metric: {exp.primaryMetric}</span>
          </div>
          <div className="text-zinc-300">Results: {exp.results}</div>
          <div className="flex flex-wrap items-center gap-4 text-zinc-500 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Start: {exp.startDate}
            </span>
            <span>Duration: {exp.duration}</span>
            {exp.confidence !== '-' && (
              <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                Confidence: {exp.confidence}
              </Badge>
            )}
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
  const [activeTab, setActiveTab] = useState('active');

  const active = MOCK_EXPERIMENTS.filter((e) => e.status === 'running');
  const completed = MOCK_EXPERIMENTS.filter((e) => e.status === 'completed');
  const draft = MOCK_EXPERIMENTS.filter((e) => e.status === 'draft');

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
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
          {active.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2">
            {completed.map((exp) => (
              <ExperimentCard key={exp.id} exp={exp} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draft.length === 0 ? (
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
