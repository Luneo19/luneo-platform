'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: { id: string; email: string; firstName?: string; lastName?: string } | null;
  action: string;
  resource: string;
  details: Record<string, unknown> | null;
  ip?: string;
  createdAt: string;
}

interface AuditResponse {
  items: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-400 border-green-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  EXPORT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), pageSize: '20' };
        if (actionFilter) params.action = actionFilter;

        const res = await fetch(`/api/admin/orion/audit-log?${new URLSearchParams(params)}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed');
        const data: AuditResponse = await res.json();

        // Handle wrapped response from backend
        const resolved = (data as unknown as { data?: AuditResponse })?.data || data;
        setEntries(resolved.items || []);
        setTotal(resolved.total || 0);
        setTotalPages(resolved.totalPages || 1);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [page, actionFilter]);

  const filtered = searchQuery
    ? entries.filter(e =>
        e.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.resource.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-zinc-400 mt-1">Journal d&apos;audit de toutes les actions administrateur</p>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Rechercher par email, action, ressource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-700 text-white"
            />
          </div>
          <Select value={actionFilter || 'all'} onValueChange={(v) => { setActionFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="EXPORT">Export</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Entries */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            {total} entrées
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">Aucune entrée trouvée</div>
          ) : (
            <div className="divide-y divide-zinc-700">
              {filtered.map((entry) => (
                <div key={entry.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="w-full px-4 py-3 flex items-center gap-4 hover:bg-zinc-800/80 transition-colors text-left"
                  >
                    <Badge variant="outline" className={ACTION_COLORS[entry.action] || 'bg-zinc-500/10 text-zinc-400'}>
                      {entry.action}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{entry.resource}</p>
                      <p className="text-xs text-zinc-500">{entry.user?.email || 'System'}</p>
                    </div>
                    <span className="text-xs text-zinc-500 whitespace-nowrap">
                      {new Date(entry.createdAt || entry.timestamp).toLocaleString('fr-FR')}
                    </span>
                    {expandedId === entry.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </button>
                  {expandedId === entry.id && entry.details && (
                    <div className="px-4 pb-3">
                      <pre className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded-lg overflow-auto max-h-40">
                        {JSON.stringify(entry.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">Page {page} sur {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-zinc-700">Précédent</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="border-zinc-700">Suivant</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
