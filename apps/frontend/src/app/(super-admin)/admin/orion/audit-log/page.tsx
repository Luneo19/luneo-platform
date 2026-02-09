'use client';

/**
 * ORION - Audit Log (Phase 6 - Admin Tools)
 * Journal d'audit with filters, table, and pagination
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, ChevronLeft, ChevronRight, ChevronDown, Download } from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  email: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'CONFIG';
  resource: string;
  details: string;
  ip: string;
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'border-green-500/30 text-green-400 bg-green-500/10',
  UPDATE: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  DELETE: 'border-red-500/30 text-red-400 bg-red-500/10',
  LOGIN: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  EXPORT: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
  CONFIG: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
};

const MOCK_ENTRIES: AuditEntry[] = [
  { id: '1', timestamp: '2026-02-08 14:32:05', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'LOGIN', resource: 'Session', details: '{"method":"credentials","2fa":true}', ip: '91.168.1.42' },
  { id: '2', timestamp: '2026-02-08 14:30:12', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'UPDATE', resource: 'Agent ARTEMIS', details: '{"status":"PAUSED","to":"ACTIVE"}', ip: '91.168.1.42' },
  { id: '3', timestamp: '2026-02-08 13:45:00', user: 'System', email: 'system', action: 'CREATE', resource: 'AutomationRun #1247', details: '{"automation":"welcome-sequence","users":5}', ip: '127.0.0.1' },
  { id: '4', timestamp: '2026-02-08 12:20:33', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'UPDATE', resource: 'Customer #c123', details: '{"plan":"STARTER","to":"PROFESSIONAL"}', ip: '91.168.1.42' },
  { id: '5', timestamp: '2026-02-08 11:15:00', user: 'System', email: 'system', action: 'CREATE', resource: 'HealthScore Batch', details: '{"users_scored":234,"avg_score":67}', ip: '127.0.0.1' },
  { id: '6', timestamp: '2026-02-08 10:05:22', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'EXPORT', resource: 'Customers CSV', details: '{"records":1234,"format":"csv"}', ip: '91.168.1.42' },
  { id: '7', timestamp: '2026-02-07 18:44:10', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'DELETE', resource: 'Segment "Inactive 30d"', details: '{"id":"seg_001","users_affected":23}', ip: '91.168.1.42' },
  { id: '8', timestamp: '2026-02-07 16:30:00', user: 'System', email: 'system', action: 'CREATE', resource: 'Campaign "Win-Back Feb"', details: '{"emails_queued":45}', ip: '127.0.0.1' },
  { id: '9', timestamp: '2026-02-07 14:22:18', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'CONFIG', resource: 'Settings', details: '{"timezone":"Europe/Paris","language":"fr"}', ip: '91.168.1.42' },
  { id: '10', timestamp: '2026-02-07 10:00:00', user: 'System', email: 'system', action: 'LOGIN', resource: 'API Key Auth', details: '{"key":"sk_live_***","scope":"read"}', ip: '52.47.12.85' },
  { id: '11', timestamp: '2026-02-06 22:15:33', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'UPDATE', resource: 'Template "Welcome"', details: '{"subject":"updated","html":"updated"}', ip: '91.168.1.42' },
  { id: '12', timestamp: '2026-02-06 18:40:00', user: 'System', email: 'system', action: 'CREATE', resource: 'Prediction Batch', details: '{"predictions":89,"model":"gpt-4"}', ip: '127.0.0.1' },
  { id: '13', timestamp: '2026-02-06 15:30:45', user: 'Emmanuel A.', email: 'admin@luneo.app', action: 'CREATE', resource: 'Segment "Power Users"', details: '{"conditions":2,"matched":234}', ip: '91.168.1.42' },
  { id: '14', timestamp: '2026-02-06 12:10:00', user: 'System', email: 'system', action: 'UPDATE', resource: 'Agent ZEUS', details: '{"lastRun":"completed","duration_ms":4520}', ip: '127.0.0.1' },
  { id: '15', timestamp: '2026-02-06 09:00:00', user: 'System', email: 'system', action: 'CREATE', resource: 'Daily Metrics', details: '{"date":"2026-02-05","mrr":12450}', ip: '127.0.0.1' },
];

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [userSearch, setUserSearch] = useState('');

  const filtered = MOCK_ENTRIES.filter(e => {
    if (actionFilter && e.action !== actionFilter) return false;
    if (userSearch && !e.user.toLowerCase().includes(userSearch.toLowerCase()) && !e.email.toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  const perPage = 10;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-400" />
            Journal d&apos;Audit
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{filtered.length} entrees</p>
        </div>
        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Toutes les actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="EXPORT">EXPORT</option>
          <option value="CONFIG">CONFIG</option>
        </select>
        <Input
          placeholder="Rechercher un utilisateur..."
          value={userSearch}
          onChange={(e) => { setUserSearch(e.target.value); setPage(1); }}
          className="max-w-xs border-zinc-700 bg-zinc-800 text-zinc-300 placeholder:text-zinc-500"
        />
      </div>

      {/* Table */}
      <Card className="border-zinc-700 bg-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Ressource</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry) => (
                  <React.Fragment key={entry.id}>
                    <tr className="border-b border-zinc-700/50 hover:bg-zinc-900/50">
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap font-mono text-xs">{entry.timestamp}</td>
                      <td className="px-4 py-3">
                        <div className="text-zinc-300 text-xs">{entry.user}</div>
                        <div className="text-zinc-500 text-xs">{entry.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={ACTION_STYLES[entry.action] || 'border-zinc-600 text-zinc-400'}>
                          {entry.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-zinc-300 text-xs">{entry.resource}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{entry.ip}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost" size="sm"
                          className="h-6 px-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-700"
                          onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                        >
                          <ChevronDown className={`h-3 w-3 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`} />
                        </Button>
                      </td>
                    </tr>
                    {expandedId === entry.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-zinc-900/80">
                          <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">{JSON.stringify(JSON.parse(entry.details), null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          Page {page} sur {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Precedent
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
