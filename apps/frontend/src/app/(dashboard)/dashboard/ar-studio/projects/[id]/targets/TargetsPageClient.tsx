'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, ImagePlus, Star, Link2, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { endpoints } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

interface ImageTarget {
  id: string;
  name?: string;
  imageUrl?: string;
  qualityScore?: number;
  trackingQuality?: string;
  linkedModelId?: string;
  triggerAction?: string;
}

interface TargetsPageClientProps {
  projectId: string;
}

export function TargetsPageClient({ projectId }: TargetsPageClientProps) {
  const { toast } = useToast();
  const [targets, setTargets] = useState<ImageTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<ImageTarget | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);

  const fetchTargets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await endpoints.ar.projects.targets.list(projectId);
      const data = (res.data as { data?: ImageTarget[] })?.data ?? [];
      setTargets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setTargets([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  useEffect(() => {
    if (!linkTarget) return;
    endpoints.ar.projects.models.list(projectId).then((res) => {
      const list = (res.data as { data?: { id: string; name: string }[] })?.data ?? [];
      setModels(Array.isArray(list) ? list : []);
    });
  }, [projectId, linkTarget]);

  const handleAnalyze = async (targetId: string) => {
    setAnalyzingId(targetId);
    try {
      await endpoints.ar.projects.targets.analyze(projectId, targetId);
      toast({ title: 'Analyse terminée', description: 'Qualité mise à jour.' });
      fetchTargets();
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleLinkModel = async () => {
    if (!linkTarget || !selectedModelId) return;
    try {
      await endpoints.ar.projects.targets.linkModel(projectId, linkTarget.id, selectedModelId);
      toast({ title: 'Modèle lié', description: 'La cible ouvre désormais ce modèle.' });
      setLinkTarget(null);
      setSelectedModelId('');
      fetchTargets();
    } catch (err) {
      toast({ title: 'Erreur', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const stars = (score?: number) => {
    const n = Math.min(5, Math.round((score ?? 0) / 20));
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < n ? 'text-amber-400 fill-amber-400' : 'text-white/30'}`}
      />
    ));
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
            <h1 className="text-xl font-semibold text-white">Cibles image</h1>
            <p className="text-sm text-white/60">Images de référence pour le suivi AR</p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Ajouter une cible
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchTargets()}>
            Réessayer
          </Button>
        </Card>
      ) : targets.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-12 text-center">
          <ImagePlus className="h-12 w-12 mx-auto text-white/40 mb-4" />
          <p className="text-white/80 mb-2">Aucune cible image</p>
          <p className="text-sm text-white/50 mb-4">Uploadez une image pour la reconnaissance AR.</p>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Ajouter une cible
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {targets.map((t) => (
            <Card key={t.id} className="border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="h-16 w-24 rounded-lg bg-white/10 overflow-hidden shrink">
                  {t.imageUrl ? (
                    <Image src={t.imageUrl} alt={t.name ?? t.id} className="w-full h-full object-cover" width={200} height={200} unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="h-6 w-6 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{t.name ?? t.id}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-0.5">{stars(t.qualityScore)}</span>
                    {t.trackingQuality && (
                      <Badge variant="secondary">{t.trackingQuality}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAnalyze(t.id)}
                    disabled={analyzingId === t.id}
                  >
                    {analyzingId === t.id ? 'Analyse…' : 'Analyser'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setLinkTarget(t)}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Lier modèle
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une cible image</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">
            Uploadez une image de référence. Le format doit être stable et contrasté pour un bon suivi.
          </p>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/10 file:text-white"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => { setUploadOpen(false); toast({ title: 'Fonctionnalité à venir' }); }}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!linkTarget} onOpenChange={(open) => !open && setLinkTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier un modèle 3D</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60 mb-4">
            Choisissez le modèle à afficher lorsque cette cible est détectée.
          </p>
          <Select value={selectedModelId} onValueChange={setSelectedModelId}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un modèle" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkTarget(null)}>
              Annuler
            </Button>
            <Button onClick={handleLinkModel} disabled={!selectedModelId}>
              Lier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
