'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  Share2,
  Edit,
  Trash2,
  RotateCcw,
  Clock,
  Sparkles,
  Eye,
  Heart,
  Copy,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { VersionTimeline } from '@/components/versioning/VersionTimeline';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { DesignDetailSkeleton } from '@/components/ui/skeletons';

interface Design {
  id: string;
  prompt?: string;
  name?: string;
  preview_url?: string;
  generated_image_url?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface DesignVersion {
  id: string;
  version_number: number;
  is_auto_save: boolean;
  preview_url?: string;
  created_at: string;
  metadata?: {
    auto_save?: boolean;
    notes?: string;
  };
}

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const designId = params.id as string;

  const [design, setDesign] = useState<Design | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDesign();
    loadVersions();
  }, [designId]);

  const loadDesign = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/designs/${designId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors du chargement du design');
      }

      const designData = result.data?.design || result.design;
      setDesign(designData);
      setCurrentVersionId(designData.id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error loading design', { error, designId, message: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    setLoadingVersions(true);
    try {
      const response = await fetch(`/api/designs/${designId}/versions?limit=50`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors du chargement des versions');
      }

      const versionsData = result.data?.versions || result.versions || [];
      setVersions(versionsData);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error loading versions', { error, designId, message: errorMessage });
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cette version ?')) {
      return;
    }

    setRestoring(versionId);
    try {
      const response = await fetch(`/api/designs/${designId}/versions/${versionId}`, {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors de la restauration');
      }

      toast({
        title: 'Version restaurée',
        description: 'Le design a été restauré à cette version',
      });

      // Recharger le design et les versions
      await Promise.all([loadDesign(), loadVersions()]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error restoring version', { error, versionId, message: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette version ?')) {
      return;
    }

    setDeleting(versionId);
    try {
      const response = await fetch(`/api/designs/${designId}/versions/${versionId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erreur lors de la suppression');
      }

      toast({
        title: 'Version supprimée',
        description: 'La version a été supprimée avec succès',
      });

      // Recharger les versions
      await loadVersions();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error deleting version', { error, versionId, message: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleViewVersion = (versionId: string) => {
    const version = versions.find((v) => v.id === versionId);
    if (version?.preview_url) {
      window.open(version.preview_url, '_blank');
    }
  };

  if (loading) {
    return <DesignDetailSkeleton />;
  }

  if (!design) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <EmptyState
          icon={<Sparkles className="w-16 h-16" />}
          title="Design non trouvé"
          description="Ce design n'existe pas ou a été supprimé"
          action={{
            label: 'Retour à la bibliothèque',
            onClick: () => router.push('/dashboard/library'),
          }}
        />
      </div>
    );
  }

  const imageUrl = design.preview_url || design.generated_image_url;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {design.name || design.prompt || 'Design sans titre'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Créé le {new Date(design.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-700">
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button variant="outline" className="border-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </div>

      {/* Design Preview & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            {imageUrl ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={imageUrl}
                  alt={design.name || design.prompt || 'Design'}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-gray-900 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-gray-600" />
              </div>
            )}
          </Card>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Informations</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Statut</p>
                <p className="text-white font-medium">
                  {design.status === 'completed' ? 'Terminé' : design.status || 'En cours'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Créé le</p>
                <p className="text-white">
                  {new Date(design.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {design.updated_at && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Modifié le</p>
                  <p className="text-white">
                    {new Date(design.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-gray-700 justify-start"
                onClick={() => router.push(`/dashboard/customize/${designId}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-700 justify-start"
                onClick={() => {
                  if (imageUrl) {
                    window.open(imageUrl, '_blank');
                  }
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir en grand
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-700 justify-start"
                onClick={() => {
                  if (imageUrl) {
                    navigator.clipboard.writeText(imageUrl);
                    toast({
                      title: 'URL copiée',
                      description: "L'URL de l'image a été copiée dans le presse-papiers",
                    });
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier l'URL
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Versions Timeline */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historique des versions
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {versions.length} version{versions.length > 1 ? 's' : ''} disponible{versions.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadVersions}
            disabled={loadingVersions}
            className="border-gray-700"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loadingVersions ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <VersionTimeline
          designId={designId}
          versions={versions}
          currentVersionId={currentVersionId || undefined}
          onRestore={handleRestore}
          onDelete={handleDeleteVersion}
          onView={handleViewVersion}
          loading={loadingVersions}
        />
      </Card>
    </div>
  );
}

