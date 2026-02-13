'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, Sparkles, PaintBucket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { endpoints } from '@/lib/api/client';

// Lazy load components
const ProductCustomizer = dynamic(
  () => import('@/components/Customizer/ProductCustomizer').then(mod => ({ default: mod.ProductCustomizer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading customizer...</p>
        </div>
      </div>
    ),
  }
);

const AIGenerationPanel = dynamic(
  () => import('@/components/Customizer/AIGenerationPanel'),
  { ssr: false }
);

function CustomizePageContent() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai');
  const [aiPreviewUrl, setAiPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await endpoints.products.get(productId);
        const payload = (data as { data?: Record<string, unknown> })?.data ?? (data as Record<string, unknown>);
        setProduct(payload && typeof payload === 'object' ? payload : null);
      } catch (error) {
        logger.error('Error loading product', {
          error,
          productId,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  const handleAiGenerated = useCallback((result: { publicId: string; imageUrl: string; thumbnailUrl?: string; arModelUrl?: string }) => {
    setAiPreviewUrl(result.imageUrl || result.thumbnailUrl || null);
    logger.info('AI generation result received', { publicId: result.publicId });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-300">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">Product not found</h1>
        <Link href="/products">
          <Button size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
              <span className="hidden sm:inline">Customize: </span>
              <span className="sm:hidden">Edit: </span>
              {product.name as string}
            </h1>
          </div>
          <Button 
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-xs sm:text-sm w-full sm:w-auto"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar: AI panel + Editor tabs */}
        <div className="w-[380px] border-r border-gray-700 bg-gray-850 overflow-y-auto flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full grid grid-cols-2 bg-gray-800 rounded-none border-b border-gray-700">
              <TabsTrigger value="ai" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 gap-1.5">
                <Sparkles className="w-4 h-4" />
                IA
              </TabsTrigger>
              <TabsTrigger value="editor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-300 gap-1.5">
                <PaintBucket className="w-4 h-4" />
                Éditeur
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="p-4 mt-0">
              <AIGenerationPanel
                productId={productId}
                onGenerated={handleAiGenerated}
                onError={(err) => logger.error('AI generation error', { error: err })}
              />
            </TabsContent>

            <TabsContent value="editor" className="mt-0 h-[calc(100%-40px)]">
              <div className="p-4 text-sm text-gray-400">
                <p>Utilisez l&apos;éditeur WYSIWYG pour des ajustements manuels précis.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main area: Preview / Editor canvas */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'ai' && aiPreviewUrl ? (
            <div className="h-full flex items-center justify-center bg-gray-950 p-8">
              <div className="relative max-w-full max-h-full">
                <img
                  src={aiPreviewUrl}
                  alt="Aperçu IA"
                  className="max-w-full max-h-[calc(100vh-120px)] object-contain rounded-lg shadow-2xl"
                />
              </div>
            </div>
          ) : activeTab === 'ai' ? (
            <div className="h-full flex items-center justify-center bg-gray-950">
              <div className="text-center text-gray-500">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">Générez un design avec l&apos;IA</p>
                <p className="text-sm mt-2">Le résultat apparaîtra ici</p>
              </div>
            </div>
          ) : (
            <div className="h-full w-full">
              <ProductCustomizer
                productId={productId}
                productImage={(product.image_url as string) || ''}
                productName={product.name as string}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MemoizedCustomizePageContent = memo(CustomizePageContent);

export default function CustomizePage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizePage">
      <MemoizedCustomizePageContent />
    </ErrorBoundary>
  );
}
