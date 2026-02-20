/**
 * ★★★ ADMIN EVENTS PAGE ★★★
 * Page pour visualiser tous les événements système
 */

'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Download, Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Event {
  id: string;
  type: string;
  data: Record<string, unknown>;
  customerId?: string | null;
  createdAt: Date | string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('30');

  React.useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const params: Record<string, string> = {};
      if (dateFilter) params.days = dateFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const data = await api.get<{ events?: Event[] }>('/api/v1/admin/events', { params });
      setEvents(data?.events ?? []);
    } catch (error) {
      logger.error('Error loading events:', error);
      setEvents([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.type.toLowerCase().includes(query) ||
          JSON.stringify(e.data).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [events, search]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(events.map((e) => e.type));
    return Array.from(types);
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Event Logs</h1>
          <p className="text-zinc-400 mt-2">
            View and filter all system events
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px] bg-zinc-900 border-zinc-700 text-white">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">
            Events ({filteredEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-zinc-700 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              {loadError ? (
                <>
                  <p className="mb-4">Unable to load events.</p>
                  <Button variant="outline" onClick={() => loadEvents()} className="border-zinc-700">
                    Retry
                  </Button>
                </>
              ) : (
                <p>No events found</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700">
                    <TableHead className="text-zinc-400">Type</TableHead>
                    <TableHead className="text-zinc-400">Data</TableHead>
                    <TableHead className="text-zinc-400">Customer</TableHead>
                    <TableHead className="text-zinc-400">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} className="border-zinc-700">
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <pre className="text-xs text-zinc-400 overflow-x-auto">
                            {JSON.stringify(event.data, null, 2).substring(0, 200)}
                            {JSON.stringify(event.data).length > 200 && '...'}
                          </pre>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {event.customerId ? (
                          <Link
                            href={`/admin/customers/${event.customerId}`}
                            className="hover:text-white underline"
                          >
                            {event.customerId.substring(0, 8)}...
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        {formatRelativeTime(event.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
