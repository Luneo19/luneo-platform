'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { endpoints } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Database,
  Upload,
  Globe,
  FileText,
  Plus,
  RefreshCw,
  FolderOpen,
  Layers,
  File,
} from 'lucide-react';
import { logger } from '@/lib/logger';

type SourceType = 'FILE' | 'WEBSITE' | 'TEXT';
type SourceStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'ERROR' | 'SYNCING' | 'PAUSED';

interface KnowledgeSource {
  id: string;
  name: string;
  type: SourceType;
  status: SourceStatus;
  documentsCount: number;
  chunksCount: number;
  errorMessage?: string | null;
  websiteUrl?: string | null;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  sourcesCount: number;
  documentsCount: number;
  chunksCount: number;
  status: string;
  lastSyncAt?: string | null;
  sources: KnowledgeSource[];
}

const SOURCE_TYPE_CONFIG: Record<SourceType, { label: string; icon: React.ReactNode }> = {
  FILE: { label: 'Fichier', icon: <File className="h-3.5 w-3.5" /> },
  WEBSITE: { label: 'Site web', icon: <Globe className="h-3.5 w-3.5" /> },
  TEXT: { label: 'Texte', icon: <FileText className="h-3.5 w-3.5" /> },
};

const SOURCE_STATUS_CONFIG: Record<SourceStatus, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  PROCESSING: {
    label: 'Traitement',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
  },
  READY: { label: 'Prêt', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ERROR: { label: 'Erreur', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  SYNCING: { label: 'Sync', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  PAUSED: { label: 'Pause', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

const ACCEPTED_FILE_TYPES = '.pdf,.txt,.md,.csv,.docx';

export default function KnowledgeBaseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const [base, setBase] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add source dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [textValue, setTextValue] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  const [reindexingId, setReindexingId] = useState<string | null>(null);

  const fetchBase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await endpoints.knowledge.bases.get(id);
      setBase(data as KnowledgeBase);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Base introuvable';
      setError(msg);
      logger.error('Knowledge base get error', { id, error: err });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !uploadFile) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      await endpoints.knowledge.sources.upload(id, formData);
      setUploadOpen(false);
      setUploadFile(null);
      await fetchBase();
    } catch (err) {
      logger.error('Upload source error', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !urlValue.trim()) return;
    setUrlLoading(true);
    try {
      await endpoints.knowledge.sources.create(id, {
        name: urlValue.trim(),
        type: 'WEBSITE',
        websiteUrl: urlValue.trim(),
      });
      setUrlOpen(false);
      setUrlValue('');
      await fetchBase();
    } catch (err) {
      logger.error('Add URL source error', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleAddText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !textValue.trim()) return;
    setTextLoading(true);
    try {
      await endpoints.knowledge.sources.create(id, {
        name: 'Texte',
        type: 'TEXT',
        textContent: textValue.trim(),
      });
      setTextOpen(false);
      setTextValue('');
      await fetchBase();
    } catch (err) {
      logger.error('Add text source error', { error: err });
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setTextLoading(false);
    }
  };

  const handleReindex = async (sourceId: string) => {
    setReindexingId(sourceId);
    try {
      await endpoints.knowledge.sources.reindex(sourceId);
      await fetchBase();
    } catch (err) {
      logger.error('Reindex source error', { error: err });
    } finally {
      setReindexingId(null);
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

  if (!id) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux bases
        </Link>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchBase}
              className="mt-2 text-sm text-red-300 underline hover:text-red-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <div className="h-24 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            <div className="space-y-3">
              <div className="h-8 w-48 rounded bg-white/[0.06]" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && base && (
          <>
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
                  <Database className="h-7 w-7 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{base.name}</h1>
                  <p className="mt-1 text-sm text-white/50">
                    {base.description || 'Aucune description'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="h-4 w-4" />
                      {base.sourcesCount} source{base.sourcesCount > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <File className="h-4 w-4" />
                      {base.documentsCount} documents
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-4 w-4" />
                      {base.chunksCount} chunks
                    </span>
                    <span>Dernière sync : {formatDate(base.lastSyncAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sources section */}
            <Card className="border-white/[0.06] bg-white/[0.02]">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg text-white">Sources</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadOpen(true)}
                      className="border-white/[0.12] text-white hover:bg-white/[0.06]"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload fichier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUrlOpen(true)}
                      className="border-white/[0.12] text-white hover:bg-white/[0.06]"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Ajouter URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTextOpen(true)}
                      className="border-white/[0.12] text-white hover:bg-white/[0.06]"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Ajouter texte
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!base.sources?.length ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] py-12">
                    <Plus className="mb-3 h-10 w-10 text-white/30" />
                    <p className="text-sm text-white/50">Aucune source pour le moment</p>
                    <p className="mt-1 text-xs text-white/30">
                      Uploadez un fichier, ajoutez une URL ou du texte
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {base.sources.map((src) => {
                      const typeCfg = SOURCE_TYPE_CONFIG[src.type] ?? SOURCE_TYPE_CONFIG.FILE;
                      const statusCfg =
                        SOURCE_STATUS_CONFIG[src.status] ?? SOURCE_STATUS_CONFIG.PENDING;

                      return (
                        <div
                          key={src.id}
                          className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/60">
                              {typeCfg.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white truncate">{src.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={`border text-xs ${statusCfg.className}`}
                                >
                                  {statusCfg.label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="border-white/[0.12] text-white/60 text-xs"
                                >
                                  {typeCfg.label}
                                </Badge>
                                <span className="text-xs text-white/40">
                                  {src.documentsCount} doc. · {src.chunksCount} chunks
                                </span>
                              </div>
                              {src.status === 'ERROR' && src.errorMessage && (
                                <p className="mt-2 text-xs text-red-400">{src.errorMessage}</p>
                              )}
                            </div>
                          </div>
                          {src.status === 'ERROR' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReindex(src.id)}
                              disabled={reindexingId === src.id}
                              className="shrink-0 border-white/[0.12] text-white hover:bg-white/[0.06]"
                            >
                              {reindexingId === src.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Réindexer
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="border-white/[0.06] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Upload fichier</DialogTitle>
            <DialogDescription className="text-white/50">
              PDF, TXT, MD, CSV, DOCX — max 20 Mo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Fichier</Label>
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                className="flex h-10 w-full rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:text-white"
              />
              {uploadFile && (
                <p className="text-xs text-white/50">{uploadFile.name}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                className="border-white/[0.12] text-white hover:bg-white/[0.06]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={uploadLoading || !uploadFile}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                {uploadLoading ? 'Upload...' : 'Uploader'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* URL dialog */}
      <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
        <DialogContent className="border-white/[0.06] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Ajouter une URL</DialogTitle>
            <DialogDescription className="text-white/50">
              Le contenu du site sera crawlé et indexé.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUrl} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-white">URL</Label>
              <Input
                id="url"
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://example.com/docs"
                required
                className="border-white/[0.06] bg-white/[0.02] text-white placeholder:text-white/30"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUrlOpen(false)}
                className="border-white/[0.12] text-white hover:bg-white/[0.06]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={urlLoading || !urlValue.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                {urlLoading ? 'Ajout...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Text dialog */}
      <Dialog open={textOpen} onOpenChange={setTextOpen}>
        <DialogContent className="border-white/[0.06] bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Ajouter du texte</DialogTitle>
            <DialogDescription className="text-white/50">
              Collez le contenu à indexer directement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddText} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text" className="text-white">Contenu</Label>
              <Textarea
                id="text"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Collez votre texte ici..."
                rows={6}
                required
                className="border-white/[0.06] bg-white/[0.02] text-white placeholder:text-white/30 resize-none"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTextOpen(false)}
                className="border-white/[0.12] text-white hover:bg-white/[0.06]"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={textLoading || !textValue.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                {textLoading ? 'Ajout...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
