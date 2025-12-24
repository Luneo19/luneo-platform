/**
 * ★★★ PAGE - WIDGET PERSONNALISATION B2C ★★★
 * Page publique pour personnaliser un produit (widget embed)
 * - PromptInput pour saisie texte
 * - Preview3D pour visualisation
 * - ARButton pour essai AR
 * - Add to cart integration
 */

'use client';

import { Suspense, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { PromptInput } from '@/components/widget/PromptInput';
import { Preview3D } from '@/components/widget/Preview3D';
import { ARButton } from '@/components/widget/ARButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function WidgetPageContent() {
  const params = useParams();
  const { toast } = useToast();
  const brandId = params.brandId as string;
  const productId = params.productId as string;

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [customizationId, setCustomizationId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Queries
  const { data: product, isLoading: isLoadingProduct } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  // Get zones from product (zones are included in product.getById)
  const zones = product?.zones || [];
  const isLoadingZones = false; // Zones are included in product query

  // Auto-select first zone
  useCallback(() => {
    if (zones && zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  const handleGenerated = useCallback(
    (id: string, preview: string, model: string) => {
      setCustomizationId(id);
      setPreviewUrl(preview);
      setModelUrl(model);
      logger.info('Customization generated', { id, preview, model });
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    if (!customizationId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez d\'abord générer une personnalisation',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      // Get customization details
      const { trpcVanilla } = await import('@/lib/trpc/vanilla-client');
      const customization = await trpcVanilla.customization.getById.query({ id: customizationId });
      
      if (!customization) {
        throw new Error('Customization not found');
      }

      // Create order via tRPC
      const order = await trpcVanilla.order.create.mutate({
        items: [
          {
            productId,
            productName: product?.name || 'Product',
            customizationId,
            designId: customization.designId || undefined,
            quantity: 1,
            price: product?.price || 0,
            totalPrice: product?.price || 0,
            metadata: {
              customizationId,
              previewUrl: previewUrl || undefined,
            },
          },
        ],
        shippingAddress: {
          name: '',
          street: '',
          city: '',
          postalCode: '',
          country: '',
        },
        customerNotes: `Customization: ${customizationId}`,
      });

      logger.info('Order created from customization', { orderId: order.id, customizationId });

      toast({
        title: 'Ajouté au panier',
        description: 'Votre personnalisation a été ajoutée au panier avec succès.',
        variant: 'default',
      });

      // Optionnel: Rediriger vers checkout
      // window.location.href = `/checkout?order=${order.id}`;
    } catch (error: any) {
      logger.error('Error adding to cart', { error, customizationId, productId });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter au panier',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
    }
  }, [customizationId, productId, product, previewUrl, toast]);

  if (isLoadingProduct || isLoadingZones) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Produit introuvable</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!zones || zones.length === 0) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Aucune zone personnalisable</p>
              <p className="text-gray-600">
                Ce produit n'a pas de zones personnalisables configurées.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const baseModelUrl = product.model3dUrl || product.baseAssetUrl || '';

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
        {product.description && (
          <p className="text-gray-600 text-lg">{product.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Prompt Input */}
        <div className="space-y-6">
          <PromptInput
            productId={productId}
            zoneId={selectedZone.id}
            maxChars={selectedZone.maxChars || 100}
            onGenerated={handleGenerated}
          />

          {/* Zone selector (if multiple zones) */}
          {zones.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zone de personnalisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {zones.map((zone) => (
                    <Button
                      key={zone.id}
                      variant={selectedZoneId === zone.id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedZoneId(zone.id)}
                    >
                      {zone.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          {previewUrl && modelUrl ? (
            <>
              <Preview3D modelUrl={modelUrl} autoRotate={true} />
              <ARButton
                modelUrl={modelUrl}
                productType={product.category?.toLowerCase() as any || 'jewelry'}
                productId={productId}
                customizationId={customizationId || undefined}
              />
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <p className="text-gray-500 mb-4">
                    Entrez votre texte pour générer un aperçu 3D personnalisé
                  </p>
                  {baseModelUrl && (
                    <Preview3D modelUrl={baseModelUrl} autoRotate={true} showControls={false} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const WidgetPage = memo(WidgetPageContent);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <WidgetPage />
      </Suspense>
    </ErrorBoundary>
  );
}

