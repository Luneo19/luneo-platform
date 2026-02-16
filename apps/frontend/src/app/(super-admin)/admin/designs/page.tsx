'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Palette, Search, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Design {
  id: string;
  name: string | null;
  status: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  brand: { id: string; name: string } | null;
  user: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

interface DesignsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [meta, setMeta] = useState<DesignsMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDesigns = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/designs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDesigns(data.designs || []);
        setMeta(data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
      }
    } catch {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchDesigns(1);
  }, [fetchDesigns]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Palette className="w-6 h-6 text-purple-400" />
          Tous les Designs
        </h1>
        <p className="text-zinc-400 mt-1">
          {meta.total} designs créés par vos clients
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher par nom ou marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-800/50 border-zinc-700"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total designs</p>
            <p className="text-2xl font-bold text-white">{meta.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Page</p>
            <p className="text-2xl font-bold text-white">{meta.page} / {Math.max(meta.totalPages, 1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Designs Table */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Designs</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-12"></TableHead>
                <TableHead className="text-zinc-400">Nom</TableHead>
                <TableHead className="text-zinc-400">Marque</TableHead>
                <TableHead className="text-zinc-400">Créateur</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designs.length === 0 ? (
                <TableRow className="border-zinc-700">
                  <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                    Aucun design trouvé
                  </TableCell>
                </TableRow>
              ) : (
                designs.map((design) => (
                  <TableRow key={design.id} className="border-zinc-700">
                    <TableCell>
                      {design.thumbnailUrl ? (
                        <img
                          src={design.thumbnailUrl}
                          alt={design.name || 'Design'}
                          className="w-10 h-10 rounded object-cover border border-zinc-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-white font-medium">{design.name || 'Sans nom'}</TableCell>
                    <TableCell className="text-zinc-300">{design.brand?.name || '—'}</TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {design.user ? `${design.user.firstName || ''} ${design.user.lastName || ''}`.trim() || design.user.email : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{design.status || 'draft'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {new Date(design.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              Page {meta.page} sur {meta.totalPages} ({meta.total} designs)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDesigns(meta.page - 1)}
                disabled={meta.page <= 1}
                className="border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDesigns(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="border-zinc-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
