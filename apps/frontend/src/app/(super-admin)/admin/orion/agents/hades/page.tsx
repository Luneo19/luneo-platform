'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Percent,
  Settings,
  Sparkles,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const MOCK_UPSELL = [
  { id: '1', customer: 'Acme Corp', plan: 'Starter', usage: 92, potentialMrr: 29, confidence: 'high' as const },
  { id: '2', customer: 'TechStart Inc', plan: 'Professional', usage: 87, potentialMrr: 79, confidence: 'high' as const },
  { id: '3', customer: 'Design Studio', plan: 'Starter', usage: 85, potentialMrr: 29, confidence: 'medium' as const },
  { id: '4', customer: 'Growth Labs', plan: 'Professional', usage: 94, potentialMrr: 79, confidence: 'high' as const },
  { id: '5', customer: 'Creative Co', plan: 'Starter', usage: 81, potentialMrr: 29, confidence: 'medium' as const },
  { id: '6', customer: 'ScaleUp Ltd', plan: 'Professional', usage: 88, potentialMrr: 79, confidence: 'high' as const },
];

const MOCK_CROSS_SELL = [
  { id: '1', name: 'API Access', description: 'Unlock API for integrations', potential: '+€19/mo' },
  { id: '2', name: 'Priority Support', description: '24/7 dedicated support', potential: '+€49/mo' },
  { id: '3', name: 'Advanced Analytics', description: 'Custom dashboards & exports', potential: '+€29/mo' },
];

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const map = {
    high: 'bg-emerald-600/60 text-white border-0',
    medium: 'bg-amber-600/50 text-zinc-100 border-0',
    low: 'bg-zinc-600 text-zinc-300 border-0',
  };
  return <Badge className={map[confidence]}>{confidence}</Badge>;
}

export default function HadesAgentPage() {
  const [upsellThreshold, setUpsellThreshold] = useState('80');
  const [autoOutreach, setAutoOutreach] = useState(false);
  const [revenueAlertThreshold, setRevenueAlertThreshold] = useState('10');

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <TrendingUp className="h-8 w-8 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">HADES - Revenue Optimizer</h1>
          <p className="text-zinc-400 text-sm">
            MRR/ARR tracking, upsell opportunities, and revenue intelligence
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-pink-600/80 text-white border-0">Active</Badge>
              <span className="text-zinc-400 text-sm">Agent is running</span>
            </div>
            <span className="text-zinc-400 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last run: 45 min ago
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Intelligence - 4 KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-pink-400" />
              MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">€12,450</div>
            <p className="text-zinc-500 text-xs mt-1">Monthly recurring revenue</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-pink-400" />
              ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">€149,400</div>
            <p className="text-zinc-500 text-xs mt-1">Annual run rate</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              Expansion Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">+€2,100/mo</div>
            <p className="text-zinc-500 text-xs mt-1">Upsells & expansions</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-pink-400" />
              Net Revenue Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">115%</div>
            <p className="text-zinc-500 text-xs mt-1">vs prior period</p>
          </CardContent>
        </Card>
      </div>

      {/* Upsell Opportunities */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Upsell Opportunities</CardTitle>
          <CardDescription className="text-zinc-400">
            Customers near plan limits (usage &gt; 80%) with upgrade potential
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400">Customer</TableHead>
                <TableHead className="text-zinc-400">Current Plan</TableHead>
                <TableHead className="text-zinc-400">Usage %</TableHead>
                <TableHead className="text-zinc-400">Potential MRR</TableHead>
                <TableHead className="text-zinc-400">Confidence</TableHead>
                <TableHead className="text-zinc-400 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_UPSELL.map((row) => (
                <TableRow key={row.id} className="border-zinc-700">
                  <TableCell className="text-zinc-200 font-medium">{row.customer}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                      {row.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={row.usage} className="h-2 flex-1 bg-zinc-700" />
                      <span className="text-zinc-300 text-sm w-8">{row.usage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-200">€{row.potentialMrr}</TableCell>
                  <TableCell>
                    <ConfidenceBadge confidence={row.confidence} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white">
                      Propose Upgrade
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cross-sell Recommendations */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-400" />
            Cross-sell Recommendations
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Recommended features and add-ons by segment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {MOCK_CROSS_SELL.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-700 bg-zinc-700/30 p-4 flex flex-col gap-2"
              >
                <div className="font-medium text-zinc-100">{item.name}</div>
                <p className="text-zinc-400 text-sm flex-1">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 text-sm font-medium">{item.potential}</span>
                  <Button size="sm" variant="outline" className="border-zinc-600 text-zinc-300">
                    Promote
                  </Button>
                </div>
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
            Upsell triggers and revenue alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-zinc-400">Upsell trigger threshold (% usage)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={upsellThreshold}
              onChange={(e) => setUpsellThreshold(e.target.value)}
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <Label className="text-zinc-400">Auto-outreach</Label>
            <div className="flex items-center gap-2">
              <Switch checked={autoOutreach} onCheckedChange={setAutoOutreach} />
              <span className="text-zinc-400 text-sm">{autoOutreach ? 'On' : 'Off'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Revenue alert threshold (%)</Label>
            <Input
              type="number"
              min={0}
              value={revenueAlertThreshold}
              onChange={(e) => setRevenueAlertThreshold(e.target.value)}
              className="bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button className="bg-pink-600 hover:bg-pink-700 text-white">Save configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
