'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Box,
  Globe,
  Camera,
  Upload,
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ComingSoonBadge } from '@/components/ui/coming-soon-badge';

interface ProductData {
  id: string;
  name: string;
  model3dUrl?: string;
  arEnabled?: boolean;
  baseAssetUrl?: string;
}

export default function Product3DARPage() {
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

  const p = product as ProductData | undefined;
  const has3D = !!(p?.model3dUrl || p?.baseAssetUrl);
  const hasAR = !!p?.arEnabled;

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusCard
          title="Modèle 3D"
          active={has3D}
          description={has3D ? 'Modèle configuré' : 'Aucun modèle 3D'}
        />
        <StatusCard
          title="AR Viewer"
          active={hasAR}
          description={hasAR ? 'AR activé' : 'Non activé'}
        />
        <StatusCard
          title="Virtual Try-On"
          active={false}
          description="Non configuré"
        />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ActionCard
          title="Configurateur 3D"
          description="Configurer les composants, options et règles du produit en 3D interactif"
          href="/dashboard/configurator-3d"
          icon={Box}
          action="Configurer"
        />
        <ActionCard
          title="AR Studio"
          description="Créer des expériences AR, gérer les modèles et les QR codes"
          href="/dashboard/ar-studio"
          icon={Globe}
          action="Ouvrir"
        />
        <div className="relative overflow-hidden rounded-xl">
          <ComingSoonBadge variant="overlay" showNotify featureKey="virtual-try-on" />
          <ActionCard
            title="Virtual Try-On"
            description="Permettre l'essayage virtuel par caméra (lunettes, bijoux, montres)"
            href={`/dashboard/virtual-try-on`}
            icon={Camera}
            action="Configurer"
          />
        </div>
      </div>

      {has3D && (
        <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-white">Zones 3D</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/50 mb-4">
              Définissez les zones personnalisables directement sur le modèle 3D.
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
              <Link href={`/products/${productId}/zones`}>
                <Upload className="w-4 h-4 mr-2" />
                Configurer les zones 3D
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusCard({ title, active, description }: { title: string; active: boolean; description: string }) {
  return (
    <Card className={`dash-card border-white/[0.06] bg-white/[0.03] ${active ? 'border-green-500/20' : ''}`}>
      <CardContent className="flex items-center gap-3 p-4">
        {active ? (
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-white/30 shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-white/50">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActionCard({
  title,
  description,
  href,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
}) {
  return (
    <Link href={href}>
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group h-full">
        <CardContent className="p-5 flex flex-col h-full">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3">
            <Icon className="w-5 h-5 text-white/60" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
          <p className="text-xs text-white/50 flex-1">{description}</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-purple-400 group-hover:text-purple-300 transition-colors">
            {action}
            <ArrowRight className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
