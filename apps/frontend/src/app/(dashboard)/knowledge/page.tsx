'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Database,
  Plus,
  FileText,
  Layers,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { logger } from '@/lib/logger';

type KBStatus = 'READY' | 'INDEXING' | 'ERROR' | 'SYNCING';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  sourcesCount?: number;
  documentsCount?: number;
  chunksCount?: number;
  status: KBStatus;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { sources: number };
}

const STATUS_CONFIG: Record<KBStatus, { label: string; className: string }> = {
  READY: { label: 'Prêt', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  INDEXING: {
    label: 'Indexation',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
  },
  ERROR: { label: 'Erreur', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  SYNCING: { label: 'Synchronisation', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
] as const;

export default function KnowledgePage() {
  const { user } = useAuth();
  const [bases, setBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    language: 'fr',
  });

  const fetchBases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await endpoints.knowledge.bases.list();
      const list = Array.isArray(data) ? data : (data as { data?: KnowledgeBase[] })?.data ?? [];
      setBases(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de charger les bases';
      setError(msg);
      logger.error('Knowledge bases list error', { error: err });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBases();
  }, [fetchBases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;
    setCreateLoading(true);
    try {
      await endpoints.knowledge.bases.create({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        language: createForm.language,
      });
      setCreateOpen(false);
      setCreateForm({ name: '', description: '', language: 'fr' });
      await fetchBases();
    } catch (err) {
      logger.error('Knowledge base create error', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bases de connaissances</h1>
            <p className="mt-1 text-sm text-white/50">
              Gérez les sources qui alimentent vos agents IA
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Créer une base
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchBases}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-white/[0.06]" />
                    <div className="h-3 w-48 rounded bg-white/[0.04]" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="h-10 rounded-lg bg-white/[0.04]" />
                  <div className="h-10 rounded-lg bg-white/[0.04]" />
                  <div className="h-10 rounded-lg bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && bases.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
              <Database className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Aucune base de connaissances
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-white/40">
              Créez-en une pour alimenter vos agents.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer une base
            </Button>
          </div>
        )}

        {/* Grid */}
        {!loading && bases.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bases.map((kb) => {
              const statusCfg = STATUS_CONFIG[kb.status] ?? STATUS_CONFIG.READY;
              const sourcesCount = kb.sourcesCount ?? kb._count?.sources ?? 0;
              const documentsCount = kb.documentsCount ?? 0;
              const chunksCount = kb.chunksCount ?? 0;

              return (
                <Card
                  key={kb.id}
                  className="border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
                          <Database className="h-6 w-6 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base text-white truncate">
                            {kb.name}
                          </CardTitle>
                          <CardDescription className="text-xs text-white/50 line-clamp-2 mt-0.5">
                            {kb.description || 'Aucune description'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 border ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5" />
                        {sourcesCount} source{sourcesCount > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {documentsCount} doc.
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {chunksCount} chunks
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <Calendar className="h-3.5 w-3.5" />
                      Dernière sync : {formatDate(kb.lastSyncAt)}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Link href={`/knowledge/${kb.id}`} className="w-full">
                      <Button variant="outline" className="w-full border-white/[0.12] text-white hover:bg-white/[0.06]">
                        Gérer
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/[0.06] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Créer une base de connaissances</DialogTitle>
            <DialogDescription className="text-white/50">
              Ajoutez une nouvelle base pour stocker vos documents et alimenter vos agents.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kb-name" className="text-white">Nom *</Label>
              <Input
                id="kb-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: FAQ Produits"
                required
                className="border-white/[0.06] bg-white/[0.02] text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-desc" className="text-white">Description</Label>
              <Input
                id="kb-desc"
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Description optionnelle"
                className="border-white/[0.06] bg-white/[0.02] text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-lang" className="text-white">Langue</Label>
              <Select
                value={createForm.language}
                onValueChange={(v) => setCreateForm((p) => ({ ...p, language: v }))}
              >
                <SelectTrigger className="border-white/[0.06] bg-white/[0.02] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.06] bg-gray-900">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value} className="text-white focus:bg-white/[0.08]">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="border-white/[0.12] text-white hover:bg-white/[0.06]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createLoading || !createForm.name.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                {createLoading ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
