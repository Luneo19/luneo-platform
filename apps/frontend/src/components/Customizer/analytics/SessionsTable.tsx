'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

interface Session {
  id: string;
  startDate: string;
  duration: number; // seconds
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  status: 'active' | 'completed' | 'abandoned';
  interactionsCount: number;
  converted: boolean;
}

interface SessionsTableProps {
  customizerId: string;
  dateFrom: Date;
  dateTo: Date;
}

export function SessionsTable({ customizerId, dateFrom, dateTo }: SessionsTableProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Session>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, sortField, sortDirection, page]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const result = await api.get<{ sessions: Session[]; total: number }>(
        `/api/v1/visual-customizer/customizers/${customizerId}/analytics/sessions`,
        {
          params: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString(),
            sort: sortField,
            order: sortDirection,
            page,
            pageSize,
            search: searchQuery || undefined,
          },
        }
      );
      setSessions(result.sessions);
    } catch (err) {
      logger.error('Failed to load sessions', { error: err });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof Session) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Start Date', 'Duration', 'User', 'Status', 'Interactions', 'Converted'].join(','),
      ...sessions.map((s) =>
        [
          new Date(s.startDate).toISOString(),
          s.duration,
          s.userEmail || 'Anonymous',
          s.status,
          s.interactionsCount,
          s.converted ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${customizerId}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const SortableHeader = ({ field, children }: { field: keyof Session; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </TableHead>
  );

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.userName?.toLowerCase().includes(query) ||
      session.userEmail?.toLowerCase().includes(query) ||
      session.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="startDate">Start Date</SortableHeader>
              <SortableHeader field="duration">Duration</SortableHeader>
              <TableHead>User</TableHead>
              <SortableHeader field="status">Status</SortableHeader>
              <SortableHeader field="interactionsCount">Interactions</SortableHeader>
              <SortableHeader field="converted">Converted</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(session.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.startDate).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(session.duration)}</TableCell>
                  <TableCell>
                    {session.userName ? (
                      <div>
                        <div className="text-sm font-medium">{session.userName}</div>
                        <div className="text-xs text-muted-foreground">{session.userEmail}</div>
                      </div>
                    ) : (
                      <Badge variant="secondary">Anonymous</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        session.status === 'completed'
                          ? 'default'
                          : session.status === 'active'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.interactionsCount}</TableCell>
                  <TableCell>
                    {session.converted ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredSessions.length} sessions
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={filteredSessions.length < pageSize}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
