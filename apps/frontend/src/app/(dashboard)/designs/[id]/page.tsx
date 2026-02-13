'use client';

import React, { useState, useEffect, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import Image from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import { useI18n } from '@/i18n/useI18n';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';
import { endpoints, api } from '@/lib/api/client';
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

function DesignDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
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
      const designData = await endpoints.designs.get(designId);
      setDesign(designData as unknown as Design);
      setCurrentVersionId((designData as unknown as Design).id);
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      logger.error('Error loading design', { error, designId, message: errorMessage });
      toast({
        title: t('common.error'),
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
      type VersionsResponse = { data?: { versions?: DesignVersion[] }; versions?: DesignVersion[] };
      const result = await api.get<VersionsResponse>(`/api/v1/designs/${designId}/versions`, { params: { limit: 50 } });
      const versionsData: DesignVersion[] = result?.data?.versions ?? result?.versions ?? [];
      setVersions(versionsData);
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
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
      await api.post(`/api/v1/designs/${designId}/versions/${versionId}/restore`);
      toast({
        title: t('designs.versionRestored'),
        description: t('designs.versionRestoredDesc'),
      });

      // Recharger le design et les versions
      await Promise.all([loadDesign(), loadVersions()]);
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      logger.error('Error restoring version', { error, versionId, message: errorMessage });
      toast({
        title: t('common.error'),
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
      await api.delete(`/api/v1/designs/${designId}/versions/${versionId}`);
      toast({
        title: t('designs.versionDeleted'),
        description: t('designs.versionDeletedDesc'),
      });

      // Recharger les versions
      await loadVersions();
    } catch (error: unknown) {
      const errorMessage = getErrorDisplayMessage(error);
      logger.error('Error deleting version', { error, versionId, message: errorMessage });
      toast({
        title: t('common.error'),
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
          title={t('designs.notFound')}
          description={t('designs.notFoundDesc')}
          action={{
            label: t('designs.backToLibrary'),
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
              {design.name || design.prompt || t('designs.untitled')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {t('designs.createdOn')} {new Date(design.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-700">
            <Share2 className="w-4 h-4 mr-2" />
            {t('designs.share')}
          </Button>
          <Button variant="outline" className="border-gray-700">
            <Download className="w-4 h-4 mr-2" />
            {t('designs.download')}
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
            <h3 className="text-lg font-semibold text-white mb-4">{t('designs.informations')}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">{t('designs.status')}</p>
                <p className="text-white font-medium">
                  {design.status === 'completed' ? t('designs.completed') : design.status || t('designs.inProgress')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">{t('designs.createdOnLabel')}</p>
                <p className="text-white">
                  {new Date(design.created_at).toLocaleDateString(undefined, {
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
                  <p className="text-sm text-gray-400 mb-1">{t('designs.modifiedOnLabel')}</p>
                  <p className="text-white">
                    {new Date(design.updated_at).toLocaleDateString(undefined, {
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
            <h3 className="text-lg font-semibold text-white mb-4">{t('designs.actions')}</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-gray-700 justify-start"
                onClick={() => router.push(`/dashboard/customize/${designId}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('designs.modify')}
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
                {t('designs.viewFullSize')}
              </Button>
              <Button
                variant="outline"
                className="w-full border-gray-700 justify-start"
                onClick={() => {
                  if (imageUrl) {
                    navigator.clipboard.writeText(imageUrl);
                    toast({
                      title: t('designs.urlCopied'),
                      description: t('designs.urlCopiedDesc'),
                    });
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                {t('designs.copyUrl')}
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
              {t('designs.versionHistory')}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {t('designs.versionsCount', { count: versions.length })}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadVersions}
            disabled={loadingVersions}
            className="border-gray-700"
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loadingVersions ? 'animate-spin' : ''}`} />
            {t('designs.refresh')}
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

const MemoizedDesignDetailPageContent = memo(DesignDetailPageContent);

export default function DesignDetailPage() {
  return (
    <ErrorBoundary level="page" componentName="DesignDetailPage">
      <MemoizedDesignDetailPageContent />
    </ErrorBoundary>
  );
}

