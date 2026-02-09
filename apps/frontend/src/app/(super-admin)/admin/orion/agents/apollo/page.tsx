'use client';

import React, { useState } from 'react';
import {
  Zap,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  Settings,
  Clock,
  Beaker,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const MOCK_LEADS = [
  { id: '1', lead: 'Sarah Chen', email: 'sarah@acme.com', score: 85, source: 'Organic', lastActivity: '2 hours ago', status: 'hot' as const },
  { id: '2', lead: 'Mike Johnson', email: 'mike@techstart.io', score: 72, source: 'Paid', lastActivity: '1 day ago', status: 'warm' as const },
  { id: '3', lead: 'Emma Wilson', email: 'emma@design.co', score: 68, source: 'Referral', lastActivity: '3 days ago', status: 'warm' as const },
  { id: '4', lead: 'James Brown', email: 'james@direct.com', score: 45, source: 'Direct', lastActivity: '1 week ago', status: 'cold' as const },
  { id: '5', lead: 'Lisa Park', email: 'lisa@growth.io', score: 91, source: 'Organic', lastActivity: '30 min ago', status: 'hot' as const },
  { id: '6', lead: 'David Lee', email: 'david@scale.com', score: 58, source: 'Paid', lastActivity: '2 days ago', status: 'warm' as const },
  { id: '7', lead: 'Anna Smith', email: 'anna@creative.co', score: 62, source: 'Referral', lastActivity: '4 days ago', status: 'warm' as const },
  { id: '8', lead: 'Tom Davis', email: 'tom@legacy.com', score: 38, source: 'Direct', lastActivity: '2 weeks ago', status: 'cold' as const },
];

const MOCK_ATTRIBUTION = [
  { source: 'Organic', percent: 42, users: 892 },
  { source: 'Paid', percent: 28, users: 594 },
  { source: 'Referral', percent: 18, users: 382 },
  { source: 'Direct', percent: 12, users: 256 },
];

const MOCK_EXPERIMENTS = [
  { id: '1', name: 'Pricing page test', status: 'running' as const, variantA: 'Control', variantB: 'New layout', metric: 'Sign-up rate', confidence: '87%' },
  { id: '2', name: 'Onboarding flow test', status: 'completed' as const, variantA: '3 steps', variantB: '5 steps', metric: 'Completion rate', confidence: '92%' },
  { id: '3', name: 'CTA button test', status: 'draft' as const, variantA: 'Primary', variantB: 'Secondary', metric: 'Click-through', confidence: '-' },
];

function StatusBadge({ status }: { status: 'hot' | 'warm' | 'cold' }) {
  const map = {
    hot: 'bg-red-600/60 text-white border-0',
    warm: 'bg-amber-600/50 text-zinc-100 border-0',
    cold: 'bg-zinc-600 text-zinc-300 border-0',
  };
  return <Badge className={map[status]}>{status}</Badge>;
}

function ExperimentStatusBadge({ status }: { status: 'running' | 'completed' | 'draft' }) {
  const map = {
    running: 'bg-blue-600/60 text-white border-0',
    completed: 'bg-emerald-600/60 text-white border-0',
    draft: 'bg-zinc-600 text-zinc-300 border-0',
  };
  return <Badge className={map[status]}>{status}</Badge>;
}

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500/80';
}

export default function ApolloAgentPage() {
  const [leadModel, setLeadModel] = useState('engagement');
  const [autoNurture, setAutoNurture] = useState(false);
  const [attributionWindow, setAttributionWindow] = useState('30d');

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Zap className="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">APOLLO - Acquisition Intelligence</h1>
          <p className="text-zinc-400 text-sm">
            Lead scoring, attribution, and A/B testing for acquisition
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600/80 text-white border-0">Active</Badge>
              <span className="text-zinc-400 text-sm">Agent is running</span>
            </div>
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last run: 20 min ago
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Acquisition Dashboard - 4 KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">156</div>
            <p className="text-zinc-500 text-xs mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">12.3%</div>
            <p className="text-zinc-500 text-xs mt-1">Trial → Paid</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-400" />
              CAC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">€34</div>
            <p className="text-zinc-500 text-xs mt-1">Customer acquisition cost</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-400" />
              Lead Score Avg
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">68</div>
            <p className="text-zinc-500 text-xs mt-1">0–100 scale</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Scoring Table */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Lead Scoring</CardTitle>
          <CardDescription className="text-zinc-400">
            Leads with score, source, and last activity
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400">Lead</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Score</TableHead>
                <TableHead className="text-zinc-400">Source</TableHead>
                <TableHead className="text-zinc-400">Last Activity</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_LEADS.map((row) => (
                <TableRow key={row.id} className="border-zinc-700">
                  <TableCell className="text-zinc-200 font-medium">{row.lead}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{row.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-2 rounded-full bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreColor(row.score)}`}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                      <span className="text-zinc-300 text-sm w-8">{row.score}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">{row.source}</TableCell>
                  <TableCell className="text-zinc-400 text-sm">{row.lastActivity}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Engage
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attribution */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Attribution
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Source breakdown (last 30 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOCK_ATTRIBUTION.map((item) => (
              <div
                key={item.source}
                className="rounded-lg border border-zinc-700 bg-zinc-700/30 p-4"
              >
                <div className="text-zinc-400 text-sm">{item.source}</div>
                <div className="text-2xl font-bold text-zinc-100 mt-1">{item.percent}%</div>
                <div className="text-zinc-500 text-xs mt-1">{item.users} users</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing section */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Beaker className="h-5 w-5 text-blue-400" />
                A/B Testing
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Experiments with variants and confidence
              </CardDescription>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Experiment</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_EXPERIMENTS.map((exp) => (
              <div
                key={exp.id}
                className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-lg border border-zinc-700 bg-zinc-700/20"
              >
                <div>
                  <div className="font-medium text-zinc-100">{exp.name}</div>
                  <div className="text-zinc-400 text-sm mt-1">
                    {exp.variantA} vs {exp.variantB} · {exp.metric} · {exp.confidence} confidence
                  </div>
                </div>
                <ExperimentStatusBadge status={exp.status} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Lead scoring and attribution settings
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-400">Lead scoring model</Label>
            <Select value={leadModel} onValueChange={setLeadModel}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="engagement" className="text-zinc-100 focus:bg-zinc-700">
                  Engagement
                </SelectItem>
                <SelectItem value="behavioral" className="text-zinc-100 focus:bg-zinc-700">
                  Behavioral
                </SelectItem>
                <SelectItem value="fit" className="text-zinc-100 focus:bg-zinc-700">
                  Fit + Engagement
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <Label className="text-zinc-400">Auto-nurture sequences</Label>
            <div className="flex items-center gap-2">
              <Switch checked={autoNurture} onCheckedChange={setAutoNurture} />
              <span className="text-zinc-400 text-sm">{autoNurture ? 'On' : 'Off'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Attribution window</Label>
            <Select value={attributionWindow} onValueChange={setAttributionWindow}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="7d" className="text-zinc-100 focus:bg-zinc-700">
                  7d
                </SelectItem>
                <SelectItem value="14d" className="text-zinc-100 focus:bg-zinc-700">
                  14d
                </SelectItem>
                <SelectItem value="30d" className="text-zinc-100 focus:bg-zinc-700">
                  30d
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
