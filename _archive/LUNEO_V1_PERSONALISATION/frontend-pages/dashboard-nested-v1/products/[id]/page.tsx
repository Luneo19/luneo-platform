'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Palette,
  Box,
  ShoppingBag,
  Factory,
  CheckCircle2,
  Circle,
  ArrowRight,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';

interface ProductData {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  images?: string[];
  status?: string;
  isActive?: boolean;
  zones?: unknown[];
  variants?: unknown[];
  model3dUrl?: string;
  arEnabled?: boolean;
}

function StepCard({
  title,
  description,
  done,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  done: boolean;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <Card className={`dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group ${done ? 'border-green-500/20' : ''}`}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            done
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/[0.06] text-white/50'
          }`}>
            {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">{title}</h3>
            <p className="text-xs text-white/50 mt-0.5">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ProductOverviewPage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: product, isLoading } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-lg font-semibold text-white mb-2">Produit introuvable</p>
        <Button asChild variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
          <Link href="/dashboard/products">Retour aux produits</Link>
        </Button>
      </div>
    );
  }

  const p = product as unknown as ProductData;
  const hasCustomizer = (p.zones?.length ?? 0) > 0;
  const has3D = !!p.model3dUrl;
  const basePath = `/dashboard/products/${productId}`;

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Informations produit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-1">Nom</p>
                <p className="text-sm text-white font-medium">{p.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Catégorie</p>
                <p className="text-sm text-white/80">{p.category || 'Non catégorisé'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Prix</p>
                <p className="text-sm text-white font-medium">{p.price ? `${p.price} €` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Statut</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                  p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                }`}>
                  {p.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {p.isActive ? 'Actif' : 'Brouillon'}
                </span>
              </div>
            </div>
            {p.description && (
              <div>
                <p className="text-xs text-white/40 mb-1">Description</p>
                <p className="text-sm text-white/70">{p.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Aperçu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-[#12121a] rounded-lg flex items-center justify-center overflow-hidden">
              {p.imageUrl || p.images?.[0] ? (
                <Image width={200} height={200}
                  src={(p.imageUrl ?? p.images?.[0]) || ''}
                  alt={p.name}
                  className="w-full h-full object-cover"
                unoptimized />
              ) : (
                <ImageIcon className="w-16 h-16 text-white/20" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Steps */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Pipeline produit</h2>
        <p className="text-sm text-white/50 mb-4">Complétez chaque étape pour mettre ce produit en vente.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StepCard
            title="Personnalisation"
            description={hasCustomizer ? `${p.zones?.length} zone(s) configurée(s)` : 'Configurer les zones personnalisables'}
            done={hasCustomizer}
            href={`${basePath}/customize`}
            icon={Palette}
          />
          <StepCard
            title="3D & AR"
            description={has3D ? 'Modèle 3D configuré' : 'Ajouter un modèle 3D ou activer l\'AR'}
            done={has3D}
            href={`${basePath}/3d-ar`}
            icon={Box}
          />
          <StepCard
            title="Distribution"
            description="Widget, Shopify, Storefront"
            done={false}
            href={`${basePath}/distribution`}
            icon={ShoppingBag}
          />
          <StepCard
            title="Production"
            description="Print-ready, POD, fabrication"
            done={false}
            href={`${basePath}/production`}
            icon={Factory}
          />
        </div>
      </div>
    </div>
  );
}
