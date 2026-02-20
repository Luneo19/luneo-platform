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

type SortKey = 'name' | 'email' | 'healthScore' | 'churnRisk' | 'lastActivity';
type SortDir = 'asc' | 'desc';
type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

type DashboardData = {
  totalUsers: number;
  avgHealthScore: number;
  atRiskCount: number;
  atRiskPercent: number;
};

type AtRiskUser = {
  id: string;
  userId: string;
  healthScore: number;
  churnRisk: string;
  lastActivityAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    lastLoginAt: string | null;
  };
};

type TableRowData = {
  id: string;
  name: string;
  email: string;
  healthScore: number;
  churnRisk: ChurnRisk;
  lastActivity: string;
  lastActivityRaw: string;
};

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

function mapAtRiskToTableRows(items: AtRiskUser[]): TableRowData[] {
  if (!Array.isArray(items)) return [];
  return items.map((r) => {
    const name = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || '—';
    const lastActivityRaw = r.lastActivityAt || r.user?.lastLoginAt || '';
    return {
      id: r.id,
      name,
      email: r.user?.email ?? '—',
      healthScore: r.healthScore ?? 0,
      churnRisk: (r.churnRisk as ChurnRisk) ?? 'LOW',
      lastActivity: lastActivityRaw ? formatDate(lastActivityRaw) : '—',
      lastActivityRaw: lastActivityRaw || '',
    };
  });
}

export default function HealthScoreDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [atRiskRows, setAtRiskRows] = useState<TableRowData[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [atRiskLoading, setAtRiskLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [atRiskError, setAtRiskError] = useState<string | null>(null);
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [healthMin, setHealthMin] = useState<string>('');
  const [healthMax, setHealthMax] = useState<string>('');
  const [activityFrom, setActivityFrom] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('healthScore');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const dashboardFallback: DashboardData = {
    totalUsers: 0,
    avgHealthScore: 0,
    atRiskCount: 0,
    atRiskPercent: 0,
  };

  useEffect(() => {
    setDashboardLoading(true);
    setDashboardError(null);
    fetch('/api/admin/orion/retention', { credentials: 'include' })
      .then((res) => {
        if (res.status === 404 || !res.ok) {
          setDashboard(dashboardFallback);
          setDashboardError('No data available');
          return null;
        }
        return res.json();
      })
      .then((data: DashboardData | null) => {
        if (data != null && typeof data === 'object' && 'totalUsers' in data) {
          setDashboard(data);
        } else if (data != null && typeof data === 'object' && 'data' in data) {
          const inner = (data as unknown as { data: DashboardData }).data;
          if (inner && 'totalUsers' in inner) setDashboard(inner);
          else setDashboard(dashboardFallback);
        } else {
          setDashboard(dashboardFallback);
        }
      })
      .catch(() => {
        setDashboard(dashboardFallback);
        setDashboardError('No data available');
      })
      .finally(() => setDashboardLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAtRiskLoading(true);
    setAtRiskError(null);
    fetch('/api/admin/orion/retention/at-risk', { credentials: 'include' })
      .then((res) => {
        if (res.status === 404 || !res.ok) {
          setAtRiskRows([]);
          return null;
        }
        return res.json();
      })
      .then((data: AtRiskUser[] | null) => {
        if (data != null && Array.isArray(data)) {
          setAtRiskRows(mapAtRiskToTableRows(data));
        } else if (data != null && typeof data === 'object' && 'data' in data) {
          // API may wrap in { data: [...] }
          const arr = (data as unknown as { data: AtRiskUser[] }).data;
          setAtRiskRows(mapAtRiskToTableRows(Array.isArray(arr) ? arr : []));
        }
      })
      .catch(() => {
        setAtRiskRows([]);
      })
      .finally(() => setAtRiskLoading(false));
  }, []);

  const filteredRows = atRiskRows.filter((r) => {
    if (churnFilter !== 'all' && r.churnRisk !== churnFilter) return false;
    const min = healthMin === '' ? -1 : parseInt(healthMin, 10);
    const max = healthMax === '' ? 101 : parseInt(healthMax, 10);
    if (!Number.isNaN(min) && r.healthScore < min) return false;
    if (!Number.isNaN(max) && r.healthScore > max) return false;
    if (activityFrom && r.lastActivityRaw) {
      const from = new Date(activityFrom);
      const last = new Date(r.lastActivityRaw);
      if (!Number.isNaN(last.getTime()) && last < from) return false;
    }
    if (activityFrom && !r.lastActivityRaw) return false;
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
        cmp = (a.lastActivityRaw ? new Date(a.lastActivityRaw).getTime() : 0) - (b.lastActivityRaw ? new Date(b.lastActivityRaw).getTime() : 0);
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

  const handleExport = () => {
    if (sortedRows.length === 0) return;
    
    // Generate CSV from current filtered and sorted data
    const headers = ['Name', 'Email', 'Health Score', 'Churn Risk', 'Last Activity'];
    const rows = sortedRows.map((row) => [
      row.name,
      row.email,
      String(row.healthScore),
      row.churnRisk,
      row.lastActivity,
    ]);
    
    const csv = [headers, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retention-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showNoData = (dashboardError != null || atRiskError != null) && !dashboardLoading && !atRiskLoading;

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
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

      {showNoData && (
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="py-4 text-zinc-400">
            No data available. The retention API is not available. Showing empty state.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-100 text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {dashboardLoading ? '—' : dashboard != null ? dashboard.totalUsers : '—'}
            </div>
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
            <div className="text-2xl font-bold text-zinc-100">
              {dashboardLoading ? '—' : dashboard != null ? Math.round(dashboard.avgHealthScore) : '—'}
            </div>
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
            <div className="text-2xl font-bold text-zinc-100">
              {dashboardLoading ? '—' : dashboard != null ? dashboard.atRiskPercent : '—'}%
            </div>
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
            <div className="text-2xl font-bold text-emerald-400">—</div>
            <p className="text-zinc-500 text-xs mt-1">win-back conversions</p>
          </CardContent>
        </Card>
      </div>

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
            onClick={handleExport}
            disabled={sortedRows.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {atRiskLoading ? (
            <div className="py-12 text-center text-zinc-400">Loading users…</div>
          ) : (
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
                {sortedRows.length === 0 ? (
                  <TableRow className="border-zinc-700">
                    <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                      {atRiskError ? 'No data available.' : 'No users match the filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRows.map((r) => (
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
                      <TableCell className="text-zinc-400">{r.lastActivity}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
