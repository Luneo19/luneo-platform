'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Mail,
  Settings,
  Eye,
  Send,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { endpoints } from '@/lib/api/client';

const MOCK_AT_RISK = [
  { id: '1', name: 'Alex Morgan', email: 'alex.m@example.com', healthScore: 22, churnRisk: 'CRITICAL' as const, lastActivity: '45 days ago' },
  { id: '2', name: 'Jordan Lee', email: 'jordan.lee@example.com', healthScore: 28, churnRisk: 'CRITICAL' as const, lastActivity: '38 days ago' },
  { id: '3', name: 'Sam Taylor', email: 'sam.t@example.com', healthScore: 35, churnRisk: 'HIGH' as const, lastActivity: '21 days ago' },
  { id: '4', name: 'Casey Kim', email: 'casey.kim@example.com', healthScore: 41, churnRisk: 'HIGH' as const, lastActivity: '18 days ago' },
  { id: '5', name: 'Riley Davis', email: 'riley.d@example.com', healthScore: 48, churnRisk: 'HIGH' as const, lastActivity: '14 days ago' },
  { id: '6', name: 'Morgan Bell', email: 'morgan.b@example.com', healthScore: 52, churnRisk: 'HIGH' as const, lastActivity: '10 days ago' },
  { id: '7', name: 'Quinn Wright', email: 'quinn.w@example.com', healthScore: 55, churnRisk: 'HIGH' as const, lastActivity: '7 days ago' },
  { id: '8', name: 'Skyler Green', email: 'skyler.g@example.com', healthScore: 58, churnRisk: 'HIGH' as const, lastActivity: '5 days ago' },
];

const MOCK_DISTRIBUTION = [
  { level: 'LOW', count: 420, color: 'bg-emerald-500' },
  { level: 'MEDIUM', count: 180, color: 'bg-amber-500' },
  { level: 'HIGH', count: 52, color: 'bg-orange-500' },
  { level: 'CRITICAL', count: 18, color: 'bg-red-500' },
];

const MOCK_WINBACK = [
  { id: 'wb1', name: 'Win-back 30 days inactive', status: 'active', sent: 1240, opened: 380, converted: 42 },
  { id: 'wb2', name: 'Churn risk re-engagement', status: 'active', sent: 890, opened: 210, converted: 28 },
  { id: 'wb3', name: 'Trial ending reminder', status: 'completed', sent: 560, opened: 320, converted: 95 },
];

type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

function churnBadgeClass(risk: ChurnRisk): string {
  switch (risk) {
    case 'CRITICAL':
      return 'bg-red-600/80 text-white border-0';
    case 'HIGH':
      return 'bg-orange-600/80 text-white border-0';
    case 'MEDIUM':
      return 'bg-amber-600/80 text-zinc-100 border-0';
    default:
      return 'bg-emerald-600/80 text-white border-0';
  }
}

function healthBarClass(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function ArtemisAgentPage() {
  const [dashboard, setDashboard] = useState<{
    totalUsers: number;
    avgHealthScore: number;
    atRiskCount: number;
    atRiskPercent: number;
    distribution: Array<{ level: string; count: number }>;
  } | null>(null);
  const [healthThreshold, setHealthThreshold] = useState([40]);
  const [autoWinBack, setAutoWinBack] = useState(true);
  const [winBackTemplate, setWinBackTemplate] = useState('winback-30d');
  const [alertNotifications, setAlertNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints.orion.retention
      .dashboard()
      .then((data) => {
        setDashboard({
          totalUsers: data.totalUsers,
          avgHealthScore: data.avgHealthScore,
          atRiskCount: data.atRiskCount,
          atRiskPercent: data.atRiskPercent,
          distribution: data.distribution,
        });
      })
      .catch(() => {
        setDashboard({
          totalUsers: 670,
          avgHealthScore: 62.4,
          atRiskCount: 70,
          atRiskPercent: 10.4,
          distribution: MOCK_DISTRIBUTION.map((d) => ({ level: d.level, count: d.count })),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const totalDist = MOCK_DISTRIBUTION.reduce((s, d) => s + d.count, 0);
  const avgHealth = dashboard?.avgHealthScore ?? 62.4;
  const atRisk = dashboard?.atRiskCount ?? 70;
  const churnRate = dashboard?.atRiskPercent ?? 10.4;
  const winBackSuccess = 12.8;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Shield className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">ARTEMIS - Retention Guardian</h1>
          <p className="text-zinc-400 text-sm">
            Health scores, churn risk, and win-back campaigns
          </p>
        </div>
      </div>

      {/* Status card */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-amber-600/80 text-white border-0">Agent Active</Badge>
              <span className="text-zinc-400 text-sm">Retention guardian is running</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <span>Last run: 2 hours ago</span>
              <span>Success rate: 94%</span>
              <span>Errors: 2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Dashboard - 4 metric cards */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Health Score Dashboard</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-zinc-800/80 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                Average Health Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full border-4 border-zinc-600 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent"
                  style={{
                    borderTopColor: 'rgb(245 158 11)',
                    borderRightColor: 'rgb(245 158 11)',
                    transform: `rotate(${(avgHealth / 100) * 360}deg)`,
                  }}
                />
                <span className="text-lg font-bold text-zinc-100 relative z-10">
                  {loading ? '—' : Math.round(avgHealth)}
                </span>
              </div>
              <p className="text-zinc-500 text-xs">out of 100</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/80 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                At-Risk Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">{loading ? '—' : atRisk}</div>
              <p className="text-zinc-500 text-xs mt-1">HIGH + CRITICAL</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/80 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-400" />
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-100">{loading ? '—' : churnRate}%</div>
              <p className="text-zinc-500 text-xs mt-1">at risk</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/80 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                Win-Back Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{winBackSuccess}%</div>
              <p className="text-zinc-500 text-xs mt-1">converted this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Distribution chart (mock) */}
        <Card className="bg-zinc-800/80 border-zinc-700 mt-4">
          <CardHeader>
            <CardTitle className="text-zinc-100">Churn risk distribution</CardTitle>
            <CardDescription className="text-zinc-400">
              Users by risk level (LOW / MEDIUM / HIGH / CRITICAL)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-10 rounded-lg overflow-hidden bg-zinc-700/50">
              {MOCK_DISTRIBUTION.map((d) => (
                <div
                  key={d.level}
                  className={`${d.color} min-w-0 flex items-center justify-center text-xs font-medium text-white transition-all`}
                  style={{ width: `${(d.count / totalDist) * 100}%` }}
                  title={`${d.level}: ${d.count}`}
                >
                  {d.count}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-zinc-400">
              {MOCK_DISTRIBUTION.map((d) => (
                <span key={d.level}>{d.level}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Customers */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">At-Risk Customers</CardTitle>
          <CardDescription className="text-zinc-400">
            Users with HIGH or CRITICAL churn risk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                <TableHead className="text-zinc-400">User</TableHead>
                <TableHead className="text-zinc-400">Email</TableHead>
                <TableHead className="text-zinc-400">Health Score</TableHead>
                <TableHead className="text-zinc-400">Churn Risk</TableHead>
                <TableHead className="text-zinc-400">Last Activity</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AT_RISK.map((row) => (
                <TableRow key={row.id} className="border-zinc-700 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-zinc-200">{row.name}</TableCell>
                  <TableCell className="text-zinc-400">{row.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-24">
                      <Progress
                        value={row.healthScore}
                        className="h-2 bg-zinc-700"
                        indicatorClassName={healthBarClass(row.healthScore)}
                      />
                      <span className="text-zinc-300 text-sm w-8">{row.healthScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={churnBadgeClass(row.churnRisk)}>{row.churnRisk}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{row.lastActivity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Win-back
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Win-Back Campaigns */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100">Win-Back Campaigns</CardTitle>
          <CardDescription className="text-zinc-400">
            Active and completed win-back email automations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {MOCK_WINBACK.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-zinc-700/30 border border-zinc-600/50"
              >
                <div>
                  <p className="font-medium text-zinc-200">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    Sent: {c.sent} · Opened: {c.opened} · Converted: {c.converted}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    c.status === 'active'
                      ? 'border-emerald-500/50 text-emerald-400'
                      : 'border-zinc-500 text-zinc-400'
                  }
                >
                  {c.status}
                </Badge>
              </li>
            ))}
          </ul>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">
            Launch Win-Back Campaign
          </Button>
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
            Health threshold, auto win-back, and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-400">Health score threshold (at-risk below)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={healthThreshold}
                onValueChange={setHealthThreshold}
                min={20}
                max={80}
                step={5}
                className="flex-1"
              />
              <span className="text-zinc-300 w-12">{healthThreshold[0]}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-600/50 p-4">
            <Label className="text-zinc-400">Auto win-back trigger</Label>
            <Switch checked={autoWinBack} onCheckedChange={setAutoWinBack} />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400">Win-back email template</Label>
            <Select value={winBackTemplate} onValueChange={setWinBackTemplate}>
              <SelectTrigger className="bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="winback-30d" className="text-zinc-100 focus:bg-zinc-700">
                  30 days inactive
                </SelectItem>
                <SelectItem value="winback-60d" className="text-zinc-100 focus:bg-zinc-700">
                  60 days inactive
                </SelectItem>
                <SelectItem value="churn-risk" className="text-zinc-100 focus:bg-zinc-700">
                  Churn risk re-engagement
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-600/50 p-4">
            <Label className="text-zinc-400">Alert notifications</Label>
            <Switch checked={alertNotifications} onCheckedChange={setAlertNotifications} />
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white">Save configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
