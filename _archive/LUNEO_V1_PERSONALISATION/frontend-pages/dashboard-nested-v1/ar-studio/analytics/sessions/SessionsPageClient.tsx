'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useARSessionsList } from '../../hooks/useARAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function SessionsPageClient() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    platform: '',
    projectId: '',
    page: 1,
    limit: 20,
  });
  const { data: sessions, meta, loading, error, refetch } = useARSessionsList(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Sessions AR</h1>
        <p className="text-sm text-white/60">Filtrer par période, plateforme et projet</p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="w-40 bg-white/5 border-white/20 text-white"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="w-40 bg-white/5 border-white/20 text-white"
            />
            <Select
              value={filters.platform || 'all'}
              onValueChange={(v) => setFilters((p) => ({ ...p, platform: v === 'all' ? '' : v }))}
            >
              <SelectTrigger className="w-40 bg-white/5 border-white/20">
                <SelectValue placeholder="Plateforme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              Appliquer
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-96 rounded-xl w-full" />
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      ) : (
        <Card className="border-white/10 bg-white/5 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Liste des sessions</CardTitle>
            {meta && (
              <p className="text-sm text-white/60">
                {meta.total} session(s) • page {meta.page}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/60">ID</TableHead>
                  <TableHead className="text-white/60">Plateforme</TableHead>
                  <TableHead className="text-white/60">Appareil</TableHead>
                  <TableHead className="text-white/60">Durée</TableHead>
                  <TableHead className="text-white/60">Interactions</TableHead>
                  <TableHead className="text-white/60">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-white/50 py-8">
                      Aucune session
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s: { id: string; platform: string; device?: string; duration: number; interactions: number; conversion: boolean }) => (
                    <TableRow key={s.id} className="border-white/10">
                      <TableCell className="font-mono text-xs text-white/80">{s.id.slice(0, 8)}…</TableCell>
                      <TableCell className="text-white/80">{s.platform}</TableCell>
                      <TableCell className="text-white/60">{s.device ?? '—'}</TableCell>
                      <TableCell className="text-white/80">{s.duration}s</TableCell>
                      <TableCell className="text-white/80">{s.interactions}</TableCell>
                      <TableCell>
                        {s.conversion ? (
                          <Badge variant="default">Oui</Badge>
                        ) : (
                          <Badge variant="secondary">Non</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
