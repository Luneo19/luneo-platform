/**
 * Client Component pour la page Configurator 3D
 * Version simplifiée avec fonctionnalités essentielles uniquement
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';
import { Configurator3DHeader } from './components/Configurator3DHeader';
import { Configurator3DControls } from './components/Configurator3DControls';
import { DesignTools } from './components/DesignTools';
import { ExportModal } from './components/modals/ExportModal';
import { useConfigurator3D } from './hooks/useConfigurator3D';
import type { Configuration3D } from './types';

// Lazy load ProductConfigurator3D (heavy component)
const ProductConfigurator3D = dynamic(
  () => import('@/components/3d-configurator/ProductConfigurator3D'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du visualiseur 3D...</p>
        </div>
      </div>
    ),
  }
);

export function Configurator3DPageClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const {
    configuration,
    isLoading,
    updateConfiguration,
    saveConfiguration,
    resetConfiguration,
  } = useConfigurator3D(selectedProduct);

  const handleSave = useCallback(async () => {
    if (!configuration) return;

    const result = await saveConfiguration();
    if (result.success) {
      toast({ title: 'Succès', description: 'Configuration sauvegardée' });
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Erreur lors de la sauvegarde',
        variant: 'destructive',
      });
    }
  }, [configuration, saveConfiguration, toast]);

  const handleExport = useCallback(() => {
    setShowExportModal(true);
  }, []);

  if (!selectedProduct) {
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
            <p className="text-gray-400 mb-4">Sélectionnez un produit pour commencer</p>
            <button
              onClick={() => router.push('/dashboard/products')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Voir les produits
            </button>
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
              {configuration?.parts?.modelUrl ? (
                <ProductConfigurator3D
                  productId={selectedProduct}
                  modelUrl={configuration.parts.modelUrl as string}
                  onSave={handleSave}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-400">
                  Aucun modèle 3D disponible pour ce produit
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



