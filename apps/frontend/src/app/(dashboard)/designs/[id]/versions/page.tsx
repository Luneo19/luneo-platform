'use client';

import React, { useState, useEffect, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  ArrowLeft,
  Clock,
  RotateCcw,
  Eye,
  Trash2,
  Download,
  GitBranch,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  History,
  FileText,
  Image as ImageIcon,
  Calendar,
  User,
  MoreVertical,
  ChevronRight,
  Diff,
  Save,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { logger } from '@/lib/logger';
import { trpc } from '@/lib/trpc/client';
import { api } from '@/lib/api/client';

interface DesignVersionMetadata {
  auto_save?: boolean;
  restored?: boolean;
  manual?: boolean;
  created_by?: string;
  [key: string]: unknown;
}

interface DesignVersionDesignData {
  thumbnail_url?: string;
  preview_url?: string;
  [key: string]: unknown;
}

interface DesignVersion {
  id: string;
  design_id: string;
  version_number: number;
  name: string;
  description: string | null;
  design_data: DesignVersionDesignData | null;
  metadata: DesignVersionMetadata | null;
  created_at: string;
  updated_at: string;
}

/**
 * Page Historique des Versions d'un Design
 * UI complète pour versioning avec gestion des versions, restauration et comparaison
 */
function DesignVersionsPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const designId = params.id as string;

  const [selectedVersion, setSelectedVersion] = useState<DesignVersion | null>(null);
  const [compareVersion, setCompareVersion] = useState<DesignVersion | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Query versions from tRPC
  const versionsQuery = trpc.design.listVersions.useQuery({ designId }, { enabled: !!designId });
  const createVersionMutation = trpc.design.createVersion.useMutation({
    onSuccess: () => {
      versionsQuery.refetch();
      toast({ title: 'Succès', description: 'Version créée' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  interface VersionRow {
    id: string;
    version?: number;
    name: string;
    metadata?: DesignVersionMetadata;
    createdAt: string;
    updatedAt: string;
  }
  // Transform data
  const versions: DesignVersion[] = (versionsQuery.data?.versions || []).map((v: VersionRow) => ({
    id: v.id,
    design_id: designId,
    version_number: v.version ?? 0,
    name: v.name,
    description: null,
    design_data: (v.metadata ?? {}) as DesignVersionDesignData | null,
    metadata: v.metadata ?? null,
    created_at: v.createdAt,
    updated_at: v.updatedAt,
  }));

  const design = versions[0] ? { id: designId, name: versions[0].name } : null;

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      await api.post(`/api/v1/designs/${designId}/versions/${selectedVersion.id}/restore`);

      toast({
        title: 'Version restaurée',
        description: `La version ${selectedVersion.version_number} a été restaurée avec succès`,
      });

      setIsRestoreModalOpen(false);
      setSelectedVersion(null);

      // Recharger les versions
      await versionsQuery.refetch();

      // Rediriger vers le design
      router.push(`/dashboard/designs/${designId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de restaurer la version';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = async () => {
    if (!versionToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/api/v1/designs/${designId}/versions/${versionToDelete}`);

      toast({
        title: 'Version supprimée',
        description: 'La version a été supprimée avec succès',
      });

      setIsDeleteModalOpen(false);
      setVersionToDelete(null);
      await versionsQuery.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de supprimer la version';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      await api.post(`/api/v1/designs/${designId}/versions`, {
        name: `Version manuelle - ${new Date().toLocaleString('fr-FR')}`,
      });

      toast({
        title: 'Version créée',
        description: 'Une nouvelle version a été créée',
      });

      await versionsQuery.refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de créer la version';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getVersionType = (version: DesignVersion) => {
    if (version.metadata?.auto_save) return 'auto';
    if (version.metadata?.restored) return 'restored';
    if (version.metadata?.manual) return 'manual';
    return 'auto';
  };

  const getVersionTypeLabel = (version: DesignVersion) => {
    const type = getVersionType(version);
    switch (type) {
      case 'auto':
        return 'Automatique';
      case 'manual':
        return 'Manuelle';
      case 'restored':
        return 'Restaurée';
      default:
        return 'Automatique';
    }
  };

  if (versionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Chargement des versions...</p>
        </div>
      </div>
    );
  }

  if (versionsQuery.error && versions.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] p-6">
        <EmptyState
          icon={<AlertCircle className="w-16 h-16 text-white/40" />}
          title="Erreur de chargement"
          description={versionsQuery.error.message || 'Une erreur est survenue'}
          action={{
            label: 'Réessayer',
            onClick: () => versionsQuery.refetch(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/designs/${designId}`}>
              <Button variant="ghost" size="icon" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04] hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <History className="w-6 h-6 sm:w-8 sm:h-8 text-white/60" />
                Historique des Versions
              </h1>
              {design && (
                <p className="text-white/60 mt-1">{design.name || 'Design'}</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleCreateVersion}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Créer une version
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="dash-card p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Total versions</p>
                <p className="text-2xl font-bold text-white">{versions.length}</p>
              </div>
              <GitBranch className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
          <Card className="dash-card p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Versions automatiques</p>
                <p className="text-2xl font-bold text-white">
                  {versions.filter((v) => getVersionType(v) === 'auto').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-[#4ade80]" />
            </div>
          </Card>
          <Card className="dash-card p-4 bg-white/[0.03] border-white/[0.06] backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60 mb-1">Dernière version</p>
                <p className="text-sm font-semibold text-white">
                  {versions.length > 0
                    ? formatDate(versions[0].created_at).date
                    : 'Aucune'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </Card>
        </div>

        {/* Timeline */}
        {versions.length === 0 ? (
          <EmptyState
            icon={<History className="w-16 h-16 text-white/40" />}
            title="Aucune version"
            description="Aucune version n'a été créée pour ce design. Les versions sont créées automatiquement lors des modifications."
            action={{
              label: 'Créer une version manuelle',
              onClick: handleCreateVersion,
            }}
          />
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => {
              const isSelected = selectedVersion?.id === version.id;
              const isCompare = compareVersion?.id === version.id;
              const dateInfo = formatDate(version.created_at);
              const isLatest = index === 0;

              return (
                <motion
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`dash-card p-6 bg-white/[0.03] border-2 backdrop-blur-sm transition-all ${
                      isSelected
                        ? 'border-purple-500/50 ring-2 ring-purple-500/20'
                        : isCompare
                        ? 'border-pink-500/50 ring-2 ring-pink-500/20'
                        : 'border-white/[0.06] hover:border-white/[0.10]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Timeline Line */}
                      <div className="flex items-start gap-4 lg:w-64">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              isLatest
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                : 'bg-white/[0.04] border-white/[0.08] text-white/60'
                            }`}
                          >
                            {isLatest ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <GitBranch className="w-6 h-6" />
                            )}
                          </div>
                          {index < versions.length - 1 && (
                            <div className="w-0.5 h-full min-h-[60px] bg-white/[0.08] mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-white">
                              v{version.version_number}
                            </span>
                            {isLatest && (
                              <span className="dash-badge-new">
                                Actuelle
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/60 mb-2">
                            {dateInfo.date} à {dateInfo.time}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              getVersionType(version) === 'auto'
                                ? 'bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/25'
                                : getVersionType(version) === 'manual'
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                                : 'bg-pink-500/15 text-pink-400 border border-pink-500/25'
                            }`}
                          >
                            {getVersionTypeLabel(version)}
                          </span>
                        </div>
                      </div>

                      {/* Version Content */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {version.name}
                          </h3>
                          {version.description && (
                            <p className="text-sm text-white/60 mb-3">
                              {version.description}
                            </p>
                          )}
                        </div>

                        {/* Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="relative aspect-video bg-[#12121a] rounded-lg overflow-hidden border border-white/[0.06]">
                            {version.design_data?.thumbnail_url ||
                            version.design_data?.preview_url ? (
                              <Image
                                src={
                                  version.design_data?.thumbnail_url ||
                                  version.design_data?.preview_url ||
                                  ''
                                }
                                alt={`Version ${version.version_number}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-16 h-16 text-white/30" />
                              </div>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-white/60">
                              <FileText className="w-4 h-4" />
                              <span>
                                {version.design_data
                                  ? Object.keys(version.design_data).length
                                  : 0}{' '}
                                propriétés
                              </span>
                            </div>
                            {version.metadata?.created_by && (
                              <div className="flex items-center gap-2 text-white/60">
                                <User className="w-4 h-4" />
                                <span>Créé par vous</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVersion(version)}
                            className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </Button>
                          {!isLatest && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedVersion(version);
                                  setIsRestoreModalOpen(true);
                                }}
                                className="border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80]/10"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Restaurer
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (compareVersion?.id === version.id) {
                                    setCompareVersion(null);
                                  } else {
                                    setCompareVersion(version);
                                  }
                                }}
                                className={`${
                                  isCompare
                                    ? 'border-purple-500/50 bg-purple-500/20 text-purple-400'
                                    : 'border-white/[0.08] text-white/80 hover:bg-white/[0.04]'
                                }`}
                              >
                                <Diff className="w-4 h-4 mr-2" />
                                {isCompare ? 'Annuler comparaison' : 'Comparer'}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setVersionToDelete(version.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-[#f87171] hover:text-[#f87171]/90 hover:bg-[#f87171]/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion>
              );
            })}
          </div>
        )}

        {/* Restore Modal */}
        <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
          <DialogContent className="bg-[#1a1a2e] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Restaurer la version</DialogTitle>
              <DialogDescription className="text-white/60">
                Êtes-vous sûr de vouloir restaurer la version{' '}
                <strong>v{selectedVersion?.version_number}</strong> ? Une sauvegarde de
                la version actuelle sera créée automatiquement.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRestoreModalOpen(false)}
                className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                disabled={restoring}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRestore}
                disabled={restoring}
                className="bg-gradient-to-r from-[#4ade80] to-emerald-600 hover:from-[#4ade80]/90 hover:to-emerald-500 text-white"
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Restauration...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restaurer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="bg-[#1a1a2e] border-white/[0.08] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Supprimer la version</DialogTitle>
              <DialogDescription className="text-white/60">
                Êtes-vous sûr de vouloir supprimer cette version ? Cette action est
                irréversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]"
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const MemoizedDesignVersionsPageContent = memo(DesignVersionsPageContent);

export default function DesignVersionsPage() {
  return (
    <ErrorBoundary level="page" componentName="DesignVersionsPage">
      <MemoizedDesignVersionsPageContent />
    </ErrorBoundary>
  );
}
