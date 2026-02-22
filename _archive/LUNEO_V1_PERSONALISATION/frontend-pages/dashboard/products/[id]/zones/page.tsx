/**
 * ★★★ PAGE - CONFIGURATION ZONES ★★★
 * Page dashboard pour configurer les zones personnalisables d'un produit
 * - Intègre ZoneConfigurator
 * - Navigation breadcrumbs
 * - Gestion erreurs
 */

'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { ZoneConfigurator } from '@/components/dashboard/ZoneConfigurator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';

// ========================================
// COMPOSANT PRINCIPAL
// ========================================

function ZonesPageContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const productId = params.id as string;

  const { data: product, isLoading } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  const handleSave = useCallback(() => {
    toast({
      title: t('productsZones.zonesSaved'),
      description: t('productsZones.zonesSavedDesc'),
      variant: 'default',
    });
    logger.info('Zones saved successfully', { productId });
  }, [t, toast, productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-8">
        <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <CardContent className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-lg font-semibold text-white mb-2">Produit introuvable</p>
              <Button asChild variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
                <Link href="/dashboard/products">Retour aux produits</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modelUrl = String((product as { model3dUrl?: string; baseAssetUrl?: string }).model3dUrl ?? (product as { baseAssetUrl?: string }).baseAssetUrl ?? '');

  if (!modelUrl) {
    return (
      <div className="container mx-auto p-8">
        <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Modèle 3D requis</CardTitle>
            <CardDescription className="text-white/60">
              Ce produit n'a pas de modèle 3D. Veuillez d'abord uploader un modèle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
              <Link href={`/products/${productId}/edit`}>Configurer le produit</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="text-white/80 hover:bg-white/[0.04] hover:text-white">
            <Link href={`/products/${productId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-white">Configuration des Zones</h1>
        <p className="text-white/60 mt-2">
          Définissez les zones personnalisables sur le modèle 3D de &quot;{(product as { name?: string }).name ?? 'Produit'}&quot;
        </p>
      </div>

      {/* Zone Configurator */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[600px]">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          </div>
        }
      >
        <ZoneConfigurator productId={productId} modelUrl={modelUrl} onSave={handleSave} />
      </Suspense>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const ZonesPage = memo(ZonesPageContent);

export default function Page() {
  return (
    <ErrorBoundary>
      <ZonesPage />
    </ErrorBoundary>
  );
}
