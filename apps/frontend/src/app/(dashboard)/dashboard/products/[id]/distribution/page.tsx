'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Globe,
  Code,
  Key,
  Zap,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  Copy,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductDistributionPage() {
  const params = useParams();
  const productId = params.id as string;
  const { toast } = useToast();

  const embedScript = `<script src="https://cdn.luneo.app/widget/v1/luneo-widget.iife.js"></script>
<div id="luneo-customizer" data-product-id="${productId}"></div>
<script>LuneoWidget.init({ productId: '${productId}' });</script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript);
    toast({ title: 'Code copié', description: 'Le code d\'intégration a été copié dans le presse-papier.' });
  };

  return (
    <div className="space-y-6">
      {/* Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChannelCard
          name="Shopify"
          description="Synchroniser ce produit avec votre boutique Shopify"
          connected={false}
          href="/dashboard/channels"
          icon="🛍️"
        />
        <ChannelCard
          name="Storefront Luneo"
          description="Vendre directement sur votre page hébergée par Luneo"
          connected={true}
          href={`/w/preview/${productId}`}
          icon="🌐"
        />
        <ChannelCard
          name="WooCommerce"
          description="Synchroniser avec votre boutique WordPress"
          connected={false}
          href="/dashboard/channels"
          icon="🔌"
        />
        <ChannelCard
          name="API publique"
          description="Intégrer via l'API REST ou le SDK TypeScript"
          connected={false}
          href="/dashboard/channels"
          icon="⚡"
        />
      </div>

      {/* Widget Embed Code */}
      <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Code d'intégration Widget</CardTitle>
              <p className="text-sm text-white/50 mt-1">
                Collez ce code sur n'importe quel site pour afficher le customizer de ce produit.
              </p>
            </div>
            <Button
              onClick={handleCopyEmbed}
              variant="outline"
              size="sm"
              className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-[#0a0a0f] rounded-lg p-4 text-xs text-green-400 overflow-x-auto border border-white/[0.06]">
            <code>{embedScript}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
          <Link href="/dashboard/channels">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Gérer tous les canaux
            <ArrowRight className="w-3 h-3 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
          <Link href="/dashboard/webhooks">
            <Code className="w-4 h-4 mr-2" />
            Webhooks
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ChannelCard({
  name,
  description,
  connected,
  href,
  icon,
}: {
  name: string;
  description: string;
  connected: boolean;
  href: string;
  icon: string;
}) {
  return (
    <Link href={href}>
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer group h-full">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center text-lg shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-white">{name}</h3>
              {connected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-white/30" />
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}
