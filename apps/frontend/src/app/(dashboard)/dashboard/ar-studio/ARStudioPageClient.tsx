/**
 * Client Component pour AR Studio
 * Version professionnelle améliorée
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradeRequiredPage } from '@/components/shared/UpgradeRequiredPage';
import { ARStudioHeader } from './components/ARStudioHeader';
import { ARStats } from './components/ARStats';
import { ARFilters } from './components/ARFilters';
import { ARModelsGrid } from './components/ARModelsGrid';
import { UploadARModal } from './components/modals/UploadARModal';
import { ARPreviewModal } from './components/modals/ARPreviewModal';
import { QRCodeModal } from './components/modals/QRCodeModal';
import { Button } from '@/components/ui/button';
import { useARModels } from './hooks/useARModels';
import { useARUpload } from './hooks/useARUpload';
import type { ARModel } from './types';

export function ARStudioPageClient() {
  const { t } = useI18n();
  return (
    <PlanGate
      minimumPlan="professional"
      showUpgradePrompt
      fallback={
        <UpgradeRequiredPage
          feature="AR Studio"
          requiredPlan="professional"
          description={t('arStudio.upgradeDesc')}
        />
      }
    >
      <ARStudioPageContent />
    </PlanGate>
  );
}

function ARStudioPageContent() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ARModel | null>(null);

  const { models, stats, isLoading, error, refetch, deleteModel, isDeleting } = useARModels(
    searchTerm,
    filterType,
    filterStatus
  );

  const { uploadFile, uploadProgress, isUploading, fileInputRef, openFileDialog, clearProgress } =
    useARUpload();

  const handlePreview = (model: ARModel) => {
    setSelectedModel(model);
    setShowPreviewModal(true);
  };

  const handleViewAR = (model: ARModel) => {
    const arUrl = `/ar/viewer?model=${model.glbUrl || model.usdzUrl}`;
    window.open(arUrl, '_blank');
  };

  const handleDelete = (modelId: string) => {
    if (confirm(t('arStudio.deleteConfirm'))) {
      deleteModel(modelId);
    }
  };

  const handleGenerateQR = (model: ARModel) => {
    setSelectedModel(model);
    setShowQRModal(true);
    setShowPreviewModal(false);
  };

  const handleCopyEmbedCode = (model: ARModel) => {
    const embedCode = `<iframe src="${window.location.origin}/ar/viewer?model=${model.glbUrl || model.usdzUrl}" width="100%" height="600px" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast({
      title: t('arStudio.copyCodeTitle'),
      description: t('arStudio.copyCodeDesc'),
    });
  };

  const handleUpload = async (
    file: File,
    name: string,
    type: string,
    onProgress?: (progress: number) => void
  ) => {
    const result = await uploadFile(file, name, type, onProgress);
    if (result.success) {
      toast({
        title: t('common.success'),
        description: t('arStudio.uploadSuccess'),
      });
      setTimeout(() => {
        refetch();
        clearProgress();
      }, 2000);
      return { success: true };
    } else {
      toast({
        title: t('common.error'),
        description: result.error || t('arStudio.uploadError'),
        variant: 'destructive',
      });
      return { success: false, error: result.error };
    }
  };

  if (error) {
    return (
      <div className="space-y-6 pb-10 flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-red-400 mb-4">{t('arStudio.loadError')}</p>
        <Button variant="outline" onClick={() => refetch()} className="border-gray-600">
          {t('aiStudio.retry')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <ARStudioHeader onUpload={() => setShowUploadModal(true)} />
      <ARStats {...stats} conversions={stats.conversions} />
      <ARFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        modelsCount={models.length}
      />
      <ARModelsGrid
        models={models}
        onPreview={handlePreview}
        onViewAR={handleViewAR}
        onDelete={handleDelete}
        onGenerateQR={handleGenerateQR}
        onCopyEmbedCode={handleCopyEmbedCode}
      />

      <UploadARModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUpload={handleUpload}
        uploadProgress={uploadProgress}
      />

      <ARPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        model={selectedModel}
        onViewAR={handleViewAR}
        onGenerateQR={handleGenerateQR}
      />

      <QRCodeModal
        open={showQRModal}
        onOpenChange={setShowQRModal}
        model={selectedModel}
      />
    </div>
  );
}



