'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Activity,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const MOCK_RETENTION = [
  { cohort: 'Jan 2025', m0: 100, m1: 72, m2: 58, m3: 45, m4: 38, m5: 32 },
  { cohort: 'Feb 2025', m0: 100, m1: 68, m2: 52, m3: 41, m4: 35, m5: '-' },
  { cohort: 'Mar 2025', m0: 100, m1: 75, m2: 60, m3: 48, m4: '-', m5: '-' },
  { cohort: 'Apr 2025', m0: 100, m1: 70, m2: 55, m3: '-', m4: '-', m5: '-' },
  { cohort: 'May 2025', m0: 100, m1: 78, m2: '-', m3: '-', m4: '-', m5: '-' },
  { cohort: 'Jun 2025', m0: 100, m1: '-', m2: '-', m3: '-', m4: '-', m5: '-' },
];

const MOCK_ANOMALIES = [
  { id: '1', message: 'MRR drop 12% vs forecast', severity: 'high', time: '2 hours ago' },
  { id: '2', message: 'Churn spike in cohort Feb 2025', severity: 'medium', time: '5 hours ago' },
  { id: '3', message: 'Unusual signup surge', severity: 'low', time: '1 day ago' },
];

function retentionColor(value: number | string): string {
  if (value === '-') return 'bg-zinc-800 text-zinc-500';
  const v = typeof value === 'number' ? value : 0;
  if (v >= 70) return 'bg-emerald-600/60 text-white';
  if (v >= 50) return 'bg-emerald-700/50 text-zinc-100';
  if (v >= 30) return 'bg-amber-600/50 text-zinc-100';
  return 'bg-red-600/50 text-zinc-100';
}

export default function ZeusAgentPage() {
  const [model, setModel] = useState('gpt-4');
  const [frequency, setFrequency] = useState('daily');
  const [churnThreshold, setChurnThreshold] = useState('0.15');
  const [revenueThreshold, setRevenueThreshold] = useState('0.10');

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <BarChart3 className="h-8 w-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">ZEUS - Analytics Mastermind</h1>
          <p className="text-zinc-400 text-sm">
            Predictive analytics, cohort analysis, and anomaly detection
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-cyan-600/80 text-white border-0">Active</Badge>
              <span className="text-zinc-400 text-sm">Agent is running</span>
            </div>
            <span className="text-zinc-400 text-sm">Last run: 1 hour ago</span>
          </div>
        </CardContent>
      </Card>

      {/* Predictive metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              Predicted churn (next 30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">47</div>
            <p className="text-zinc-500 text-xs mt-1">users at risk</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Revenue forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">€124.2k</div>
            <p className="text-zinc-500 text-xs mt-1">next 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Growth rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">+8.2%</div>
            <p className="text-zinc-500 text-xs mt-1">vs previous period</p>
          </CardContent>
        </Card>
      </div>

      {/* Cohort analysis */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Cohort retention matrix</CardTitle>
          <CardDescription className="text-zinc-400">
            Retention % by cohort (row) and month (column)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 px-3 text-zinc-400 font-medium">Cohort</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M0</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M1</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M2</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M3</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M4</th>
                <th className="text-center py-2 px-2 text-zinc-400 font-medium">M5</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RETENTION.map((row) => (
                <tr key={row.cohort} className="border-b border-zinc-700/50">
                  <td className="py-2 px-3 text-zinc-200">{row.cohort}</td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m0)}`}
                    >
                      {row.m0}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m1)}`}
                    >
                      {row.m1}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m2)}`}
                    >
                      {row.m2}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m3)}`}
                    >
                      {row.m3}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m4)}`}
                    >
                      {row.m4}
                    </span>
                  </td>
                  <td className="text-center py-2 px-2">
                    <span
                      className={`inline-block w-10 py-1 rounded ${retentionColor(row.m5)}`}
                    >
                      {row.m5}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Anomaly detection */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Anomaly detection
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Detected deviations from expected patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {MOCK_ANOMALIES.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-700/30 border border-zinc-600/50"
              >
                <span className="text-zinc-200">{a.message}</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      a.severity === 'high'
                        ? 'border-red-500/50 text-red-400'
                        : a.severity === 'medium'
                          ? 'border-amber-500/50 text-amber-400'
                          : 'border-zinc-500 text-zinc-400'
                    }
                  >
                    {a.severity}
                  </Badge>
                  <span className="text-zinc-500 text-sm">{a.time}</span>
                </div>
              </li>
            ))}
          </ul>
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
            Prediction model and alert thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-zinc-400">Prediction model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="gpt-4" className="text-zinc-100 focus:bg-zinc-700">
                  GPT-4
                </SelectItem>
                <SelectItem value="gpt-3.5" className="text-zinc-100 focus:bg-zinc-700">
                  GPT-3.5
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Analysis frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="hourly" className="text-zinc-100 focus:bg-zinc-700">
                  Hourly
                </SelectItem>
                <SelectItem value="daily" className="text-zinc-100 focus:bg-zinc-700">
                  Daily
                </SelectItem>
                <SelectItem value="weekly" className="text-zinc-100 focus:bg-zinc-700">
                  Weekly
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Churn alert threshold</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={churnThreshold}
              onChange={(e) => setChurnThreshold(e.target.value)}
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Revenue alert threshold</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={revenueThreshold}
              onChange={(e) => setRevenueThreshold(e.target.value)}
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">Save configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
