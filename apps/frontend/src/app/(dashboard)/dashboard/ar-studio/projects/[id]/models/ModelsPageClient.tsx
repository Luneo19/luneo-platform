'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Box,
  Trash2,
  RefreshCw,
  Sparkles,
  Eye,
  Layers,
  FileBox,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useARProjectModels, type ProjectARModel, type ConversionStatus, type ValidationStatus } from '../../../hooks/useARProjectModels';
import { useModelUpload } from '../../../hooks/useModelUpload';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

function formatBytes(n?: number) {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ConversionBadge({ status }: { status?: ConversionStatus }) {
  const map: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
    pending: { label: 'En attente', variant: 'secondary' },
    converting: { label: 'Conversion…', variant: 'default' },
    done: { label: 'Prêt', variant: 'outline' },
    error: { label: 'Erreur', variant: 'destructive' },
  };
  const c = status ? map[status] : map.pending;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function ValidationBadge({ status }: { status?: ValidationStatus }) {
  const map: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
    valid: { label: 'Valide', variant: 'outline' },
    invalid: { label: 'Invalide', variant: 'destructive' },
    pending: { label: 'En cours', variant: 'secondary' },
  };
  const c = status ? map[status] : map.pending;
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

interface ModelsPageClientProps {
  projectId: string;
}

export function ModelsPageClient({ projectId }: ModelsPageClientProps) {
  const { toast } = useToast();
  const { models, loading, error, refetch, convert, optimize, deleteModel } = useARProjectModels(projectId);
  const { upload, progress, status, reset, isUploading } = useModelUpload({
    projectId,
    onComplete: (id, name) => {
      toast({ title: 'Modèle importé', description: name });
      refetch();
      reset();
    },
    onError: (e) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectARModel | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file) return;
    upload(file);
    setFile(null);
    setUploadOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/ar-studio/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">Modèles 3D</h1>
            <p className="text-sm text-white/60">Gérer les modèles du projet</p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Importer
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-white/10 bg-white/5">
              <Skeleton className="h-40 rounded-t-lg w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      ) : models.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <Box className="h-12 w-12 mx-auto text-white/40 mb-4" />
          <p className="text-white/80 mb-2">Aucun modèle</p>
          <p className="text-sm text-white/50 mb-4">Importez un fichier GLB, USDZ ou OBJ pour commencer.</p>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer un modèle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => (
            <Card key={m.id} className="border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-colors">
              <div className="relative aspect-video bg-white/5">
                {m.thumbnailUrl ? (
                  <Image src={m.thumbnailUrl} alt={m.name} className="w-full h-full object-cover" width={200} height={200} unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileBox className="h-12 w-12 text-white/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-wrap gap-1">
                  {(m.format || []).map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white truncate">{m.name}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-white/60">
                  <span>{formatBytes(m.fileSize)}</span>
                  {m.polyCount != null && <span>• {m.polyCount.toLocaleString()} polys</span>}
                  {m.lodLevels != null && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> LOD {m.lodLevels}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <ConversionBadge status={m.conversionStatus} />
                  <ValidationBadge status={m.validationStatus} />
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => convert(m.id)}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Convertir
                </Button>
                <Button variant="outline" size="sm" onClick={() => optimize(m.id)}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Optimiser
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/ar-studio/preview?model=${m.id}`}>
                    <Eye className="h-3 w-3 mr-1" />
                    Aperçu
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => setDeleteTarget(m)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importer un modèle 3D</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="file"
              accept=".glb,.gltf,.usdz,.obj"
              className="w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/10 file:text-white"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {isUploading && (
              <div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-white/60 mt-1">{status} – {progress}%</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le modèle</DialogTitle>
          </DialogHeader>
          <p className="text-white/80">
            Supprimer « {deleteTarget?.name} » ? Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleteTarget) {
                  await deleteModel(deleteTarget.id);
                  setDeleteTarget(null);
                  toast({ title: 'Modèle supprimé' });
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
