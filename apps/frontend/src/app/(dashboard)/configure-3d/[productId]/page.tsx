'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { logger } from '@/lib/logger';

// Lazy load 3D Configurator
const ProductConfigurator3D = dynamic(
  () => import('@/components/3d-configurator/ProductConfigurator3D'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading 3D configurator...</p>
        </div>
      </div>
    ),
  }
);

function Configure3DPageContent() {
  const params = useParams();
  const productId = params.productId as string;
  const { toast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [config3D, setConfig3D] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProductAndConfig() {
      try {
        // Fetch product
        const productRes = await fetch(`/api/products/${productId}`);
        if (!productRes.ok) throw new Error('Product not found');
        const productData = await productRes.json();
        setProduct(productData.data);

        // Fetch 3D configuration
        const configRes = await fetch(`/api/3d/config?productId=${productId}`);
        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig3D(configData.data);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
        setLoading(false);
      }
    }

    loadProductAndConfig();
  }, [productId]);

  const handleSaveConfiguration = async (configuration: any) => {
    try {
      const response = await fetch('/api/3d-configurations/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          configId: config3D?.id,
          configuration,
        }),
      });

      if (response.ok) {
        // Success feedback
      }
    } catch (error) {
      logger.error('Error saving 3D configuration', {
        error,
        productId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleExportAR = async (platform: 'ios' | 'android') => {
    try {
      if (!config3D?.id) {
        toast({
          title: 'Configuration requise',
          description: 'Sauvegardez la configuration 3D avant d’exporter en AR.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Export AR en cours',
        description: `Préparation du package ${platform === 'ios' ? 'USDZ' : 'GLB'}...`
      });

      const response = await fetch('/api/3d/export-ar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configurationId: config3D.id,
          platform,
          includeTextures: true
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Export AR échoué');
      }

      toast({
        title: 'Export terminé',
        description: `Téléchargement disponible pour ${platform.toUpperCase()}.`
      });

      if (result.data?.exportUrl) {
        window.open(result.data.exportUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      logger.error('Error exporting AR', {
        error,
        productId,
        platform,
        message: error.message || 'Unknown error',
      });
      toast({
        title: 'Erreur export AR',
        description: error.message || `Impossible d'exporter pour ${platform.toUpperCase()}`,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-300 font-medium">Loading 3D Configurator...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Product Not Found</h1>
          <p className="text-gray-300 mb-6">{error || 'The requested product does not exist'}</p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!config3D || !config3D.model_glb_url) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">3D Configuration Not Available</h1>
          <p className="text-gray-300 mb-6">This product does not support 3D customization yet</p>
          <Link href={`/customize/${productId}`}>
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Try 2D Customizer Instead
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/products">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">
                3D Configurator: {product.name}
              </h1>
              <p className="text-sm text-gray-300">
                Customize your product in 3D and view in AR
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportAR('ios')}
              className="bg-white/20 hover:bg-white/30 text-white text-sm"
            >
              Export AR
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm"
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* 3D Configurator */}
      <div className="flex-1">
        <ProductConfigurator3D
          productId={productId}
          modelUrl={config3D.model_glb_url}
          onSave={handleSaveConfiguration}
        />
      </div>
    </div>
  );
}

const MemoizedConfigure3DPageContent = memo(Configure3DPageContent);

export default function Configure3DPage() {
  return (
    <ErrorBoundary level="page" componentName="Configure3DPage">
      <MemoizedConfigure3DPageContent />
    </ErrorBoundary>
  );
}
