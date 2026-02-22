'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Palette,
  Layers,
  Settings,
  Image as ImageIcon,
  Sliders,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface CustomizerItem {
  id: string;
  name?: string;
  status?: string;
  type?: string;
}

export default function ProductCustomizePage() {
  const params = useParams();
  const productId = params.id as string;

  const { data: customizers, isLoading } = trpc.visualCustomizer.customizer.list.useQuery(
    undefined,
    { enabled: !!productId }
  );

  const customizersList: CustomizerItem[] = (() => {
    const raw = customizers as unknown;
    if (Array.isArray(raw)) return raw as CustomizerItem[];
    if (raw && typeof raw === 'object' && 'customizers' in raw) {
      return (raw as { customizers: CustomizerItem[] }).customizers ?? [];
    }
    return [];
  })();
  const productCustomizers = customizersList.filter(
    (c: CustomizerItem) => (c as { productId?: string }).productId === productId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (productCustomizers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Aucune personnalisation configurée</h2>
          <p className="text-sm text-white/50 mb-6 max-w-md mx-auto">
            Créez un customizer pour permettre à vos clients de personnaliser ce produit avec du texte, des images et des couleurs.
          </p>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white">
            <Link href={`/dashboard/customizer/new?productId=${productId}`}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un customizer
            </Link>
          </Button>
        </div>

        {/* Quick links to related tools */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            title="Zones de personnalisation"
            description="Définir les zones sur le produit"
            href={`/dashboard/customizer/new?productId=${productId}`}
            icon={Layers}
          />
          <QuickLink
            title="Studio IA"
            description="Générer des designs par IA"
            href="/dashboard/ai-studio"
            icon={Palette}
          />
          <QuickLink
            title="Bibliothèque"
            description="Parcourir les templates"
            href="/dashboard/library"
            icon={ImageIcon}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Customizers liés</h2>
          <p className="text-sm text-white/50">{productCustomizers.length} customizer(s) configuré(s)</p>
        </div>
        <Button asChild variant="outline" className="border-white/[0.08] text-white/80 hover:bg-white/[0.04]">
          <Link href={`/dashboard/customizer/new?productId=${productId}`}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {productCustomizers.map((c: CustomizerItem) => (
          <Card key={c.id} className="dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base">{c.name || 'Customizer'}</CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/50'
                }`}>
                  {c.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mt-2">
                <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                  <Link href={`/dashboard/customizer/${c.id}/zones`}>
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Zones
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                  <Link href={`/dashboard/customizer/${c.id}/presets`}>
                    <Sliders className="w-3.5 h-3.5 mr-1.5" />
                    Presets
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                  <Link href={`/dashboard/customizer/${c.id}/edit`}>
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Éditer
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
                  <Link href={`/dashboard/customizer/${c.id}/embed`}>
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Embed
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href}>
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group h-full">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{title}</p>
            <p className="text-xs text-white/40">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
