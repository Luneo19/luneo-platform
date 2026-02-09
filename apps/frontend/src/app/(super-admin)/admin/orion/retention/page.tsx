'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  TrendingUp,
  Download,
  Filter,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { endpoints } from '@/lib/api/client';

type SortKey = 'name' | 'email' | 'healthScore' | 'churnRisk' | 'lastActivity';
type SortDir = 'asc' | 'desc';

const MOCK_USERS = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex.m@example.com', healthScore: 22, churnRisk: 'CRITICAL' as const, lastActivity: '2025-01-02' },
  { id: 'u2', name: 'Jordan Lee', email: 'jordan.lee@example.com', healthScore: 28, churnRisk: 'CRITICAL' as const, lastActivity: '2025-01-05' },
  { id: 'u3', name: 'Sam Taylor', email: 'sam.t@example.com', healthScore: 35, churnRisk: 'HIGH' as const, lastActivity: '2025-01-18' },
  { id: 'u4', name: 'Casey Kim', email: 'casey.kim@example.com', healthScore: 41, churnRisk: 'HIGH' as const, lastActivity: '2025-01-20' },
  { id: 'u5', name: 'Riley Davis', email: 'riley.d@example.com', healthScore: 48, churnRisk: 'HIGH' as const, lastActivity: '2025-01-24' },
  { id: 'u6', name: 'Morgan Bell', email: 'morgan.b@example.com', healthScore: 52, churnRisk: 'HIGH' as const, lastActivity: '2025-01-28' },
  { id: 'u7', name: 'Quinn Wright', email: 'quinn.w@example.com', healthScore: 55, churnRisk: 'HIGH' as const, lastActivity: '2025-02-01' },
  { id: 'u8', name: 'Skyler Green', email: 'skyler.g@example.com', healthScore: 58, churnRisk: 'HIGH' as const, lastActivity: '2025-02-03' },
  { id: 'u9', name: 'Jamie Fox', email: 'jamie.f@example.com', healthScore: 65, churnRisk: 'MEDIUM' as const, lastActivity: '2025-02-05' },
  { id: 'u10', name: 'Drew Hill', email: 'drew.h@example.com', healthScore: 72, churnRisk: 'MEDIUM' as const, lastActivity: '2025-02-06' },
  { id: 'u11', name: 'Blake Stone', email: 'blake.s@example.com', healthScore: 78, churnRisk: 'LOW' as const, lastActivity: '2025-02-07' },
  { id: 'u12', name: 'Cameron Reed', email: 'cameron.r@example.com', healthScore: 85, churnRisk: 'LOW' as const, lastActivity: '2025-02-08' },
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

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HealthScoreDashboardPage() {
  const [dashboard, setDashboard] = useState<{
    totalUsers: number;
    avgHealthScore: number;
    atRiskCount: number;
    atRiskPercent: number;
  } | null>(null);
  const [rows, setRows] = useState(MOCK_USERS);
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [healthMin, setHealthMin] = useState<string>('');
  const [healthMax, setHealthMax] = useState<string>('');
  const [activityFrom, setActivityFrom] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('healthScore');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
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
        });
      })
      .catch(() => {
        setDashboard({
          totalUsers: 670,
          avgHealthScore: 62.4,
          atRiskCount: 70,
          atRiskPercent: 10.4,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = rows.filter((r) => {
    if (churnFilter !== 'all' && r.churnRisk !== churnFilter) return false;
    const min = healthMin === '' ? -1 : parseInt(healthMin, 10);
    const max = healthMax === '' ? 101 : parseInt(healthMax, 10);
    if (!Number.isNaN(min) && r.healthScore < min) return false;
    if (!Number.isNaN(max) && r.healthScore > max) return false;
    if (activityFrom) {
      const from = new Date(activityFrom);
      const last = new Date(r.lastActivity);
      if (last < from) return false;
    }
    return true;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email);
        break;
      case 'healthScore':
        cmp = a.healthScore - b.healthScore;
        break;
      case 'churnRisk': {
        const order: Record<ChurnRisk, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        cmp = order[a.churnRisk] - order[b.churnRisk];
        break;
      }
      case 'lastActivity':
        cmp = new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime();
        break;
      default:
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const totalUsers = dashboard?.totalUsers ?? 670;
  const avgHealth = dashboard?.avgHealthScore ?? 62.4;
  const atRiskPct = dashboard?.atRiskPercent ?? 10.4;
  const savedThisMonth = 42;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700">
          <Activity className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Health Score Dashboard</h1>
          <p className="text-zinc-400 text-sm">
            All users with health scores, filters, and export
          </p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{loading ? '—' : totalUsers}</div>
            <p className="text-zinc-500 text-xs mt-1">with health score</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-400" />
              Average Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{loading ? '—' : Math.round(avgHealth)}</div>
            <p className="text-zinc-500 text-xs mt-1">out of 100</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              At Risk %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{loading ? '—' : atRiskPct}%</div>
            <p className="text-zinc-500 text-xs mt-1">HIGH + CRITICAL</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Saved This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{savedThisMonth}</div>
            <p className="text-zinc-500 text-xs mt-1">win-back conversions</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Churn risk, health score range, last activity
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Churn risk</Label>
            <Select value={churnFilter} onValueChange={setChurnFilter}>
              <SelectTrigger className="w-[140px] bg-zinc-700/50 border-zinc-600 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-zinc-100 focus:bg-zinc-700">All</SelectItem>
                <SelectItem value="LOW" className="text-zinc-100 focus:bg-zinc-700">LOW</SelectItem>
                <SelectItem value="MEDIUM" className="text-zinc-100 focus:bg-zinc-700">MEDIUM</SelectItem>
                <SelectItem value="HIGH" className="text-zinc-100 focus:bg-zinc-700">HIGH</SelectItem>
                <SelectItem value="CRITICAL" className="text-zinc-100 focus:bg-zinc-700">CRITICAL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Health score min</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={healthMin}
              onChange={(e) => setHealthMin(e.target.value)}
              className="w-[100px] bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Health score max</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="100"
              value={healthMax}
              onChange={(e) => setHealthMax(e.target.value)}
              className="w-[100px] bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs">Last activity from</Label>
            <Input
              type="date"
              value={activityFrom}
              onChange={(e) => setActivityFrom(e.target.value)}
              className="w-[160px] bg-zinc-700/50 border-zinc-600 text-zinc-100"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
              onClick={() => {
                setChurnFilter('all');
                setHealthMin('');
                setHealthMax('');
                setActivityFrom('');
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full table */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100">All users</CardTitle>
            <CardDescription className="text-zinc-400">
              Sortable columns. {sortedRows.length} row(s) after filters.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Export (placeholder)
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    User
                    {sortKey === 'name' && (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </span>
                </TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('email')}
                >
                  <span className="flex items-center gap-1">
                    Email
                    {sortKey === 'email' && (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </span>
                </TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('healthScore')}
                >
                  <span className="flex items-center gap-1">
                    Health Score
                    {sortKey === 'healthScore' && (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </span>
                </TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('churnRisk')}
                >
                  <span className="flex items-center gap-1">
                    Churn Risk
                    {sortKey === 'churnRisk' && (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </span>
                </TableHead>
                <TableHead
                  className="text-zinc-400 cursor-pointer hover:text-zinc-200"
                  onClick={() => toggleSort('lastActivity')}
                >
                  <span className="flex items-center gap-1">
                    Last Activity
                    {sortKey === 'lastActivity' && (sortDir === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((r) => (
                <TableRow key={r.id} className="border-zinc-700 hover:bg-zinc-800/50">
                  <TableCell className="font-medium text-zinc-200">{r.name}</TableCell>
                  <TableCell className="text-zinc-400">{r.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-28">
                      <Progress
                        value={r.healthScore}
                        className="h-2 bg-zinc-700 flex-1"
                        indicatorClassName={healthBarClass(r.healthScore)}
                      />
                      <span className="text-zinc-300 text-sm w-8">{r.healthScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={churnBadgeClass(r.churnRisk)}>{r.churnRisk}</Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400">{formatDate(r.lastActivity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
