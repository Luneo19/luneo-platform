/**
 * Client Component pour la page Configurator 3D
 * Version simplifiée avec fonctionnalités essentielles uniquement
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradeRequiredPage } from '@/components/shared/UpgradeRequiredPage';
import { Configurator3DHeader } from './components/Configurator3DHeader';
import { Configurator3DControls } from './components/Configurator3DControls';
import { DesignTools } from './components/DesignTools';
import { ExportModal } from './components/modals/ExportModal';
import { useConfigurator3D } from './hooks/useConfigurator3D';
import { api, endpoints } from '@/lib/api/client';
import type { Configuration3D } from './types';

// Lazy load ProductConfigurator3D (heavy component)
function Configurator3DLoadingFallback() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">{t('configurator3d.loadingViewer')}</p>
      </div>
    </div>
  );
}

const ProductConfigurator3D = dynamic(
  () => import('@/components/3d-configurator/ProductConfigurator3D'),
  {
    ssr: false,
    loading: () => <Configurator3DLoadingFallback />,
  }
);

export function Configurator3DPageClient() {
  const { t } = useI18n();
  return (
    <PlanGate
      minimumPlan="professional"
      showUpgradePrompt
      fallback={
        <UpgradeRequiredPage
          feature={t('configurator3d.upgradeFeature')}
          requiredPlan="professional"
          description={t('configurator3d.upgradeDescription')}
        />
      }
    >
      <Configurator3DPageContent />
    </PlanGate>
  );
}

function Configurator3DPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [showExportModal, setShowExportModal] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedConfigurationId, setSelectedConfigurationId] = useState<string | null>(null);

  useEffect(() => {
    endpoints.projects
      .list({ limit: 1 })
      .then((res) => {
        const data = res?.data as { id?: string }[] | undefined;
        const first = Array.isArray(data) && data.length > 0 ? data[0] : undefined;
        if (first && typeof first === 'object' && 'id' in first && typeof first.id === 'string') {
          setProjectId(first.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api
      .get<{ data?: { id?: string }[] }>('/api/v1/configurator-3d/configurations', {
        params: { projectId, limit: 1 },
      })
      .then((res) => {
        const list = (res && typeof res === 'object' && 'data' in res) ? (res as { data?: { id?: string }[] }).data : undefined;
        const first = Array.isArray(list) && list.length > 0 ? list[0] : undefined;
        if (first && typeof first === 'object' && 'id' in first && typeof first.id === 'string') {
          setSelectedConfigurationId(first.id);
        }
      })
      .catch(() => {});
  }, [projectId]);

  const {
    configuration,
    isLoading,
    updateConfiguration,
    saveConfiguration,
    resetConfiguration,
  } = useConfigurator3D(projectId, selectedConfigurationId);

  const isLoadingConfig = !!selectedConfigurationId && isLoading;

  const handleSave = useCallback(async () => {
    if (!configuration) return;

    const result = await saveConfiguration();
    if (result.success) {
      toast({ title: t('configurator3d.success'), description: t('configurator3d.saved') });
    } else {
      toast({
        title: t('configurator3d.error'),
        description: result.error || t('configurator3d.errorSaving'),
        variant: 'destructive',
      });
    }
  }, [configuration, saveConfiguration, toast, t]);

  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  if (!selectedConfigurationId) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <Configurator3DHeader
            onBack={() => router.push('/dashboard/products')}
            onSave={handleSave}
            onExport={handleExport}
            canSave={!!configuration}
          />
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">{t('configurator3d.selectConfigFirst')}</p>
            <button
              onClick={() => router.push('/dashboard/products')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {t('configurator3d.viewProducts')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <Configurator3DHeader
            onBack={() => router.push('/dashboard/products')}
            onSave={handleSave}
            onExport={handleExport}
            canSave={false}
          />
          <div className="flex items-center justify-center h-96 mt-6 rounded-lg bg-gray-800/50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
              <p className="text-gray-400">{t('configurator3d.loadingConfig')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <Configurator3DHeader
          onBack={() => router.push('/dashboard/products')}
          onSave={handleSave}
          onExport={handleExport}
          canSave={!!configuration}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4">
              {configuration?.parts?.modelUrl && typeof configuration.parts.modelUrl === 'string' ? (
                <ProductConfigurator3D
                  productId={selectedConfigurationId || ''}
                  projectId={projectId || ''}
                  modelUrl={configuration.parts.modelUrl}
                  onSave={handleSave}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-400">
                  {t('configurator3d.noModelForProduct')}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Configurator3DControls
              configuration={configuration}
              onUpdate={updateConfiguration}
              onReset={resetConfiguration}
            />
            <DesignTools
              configuration={configuration}
              onUpdate={updateConfiguration}
            />
          </div>
        </div>

        <ExportModal
          open={showExportModal}
          onOpenChange={setShowExportModal}
          configuration={configuration}
        />
      </div>
    </div>
  );
}



