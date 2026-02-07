'use client';

import React, { useEffect, useState, memo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { endpoints } from '@/lib/api/client';

// Lazy load ProductCustomizer
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

function CustomizePageContent() {
  const params = useParams();
  const productId = params.productId as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await endpoints.products.get(productId);
        setProduct((data as { data?: unknown })?.data ?? data);
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
      <div className="bg-gray-800 border-b border-gray-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link href="/products">
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">
              <span className="hidden sm:inline">Customize: </span>
              <span className="sm:hidden">Edit: </span>
              {product.name}
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
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full">
          <ProductCustomizer
            productId={productId}
            productImage={product.image_url || ''}
            productName={product.name}
          />
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
