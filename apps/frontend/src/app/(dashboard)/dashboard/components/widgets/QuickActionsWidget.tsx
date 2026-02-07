'use client';

import React from 'react';
import Link from 'next/link';
import { useIndustryStore } from '@/store/industry.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Upload,
  Box,
  Palette,
  Layout,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  { href: '/dashboard/editor', label: 'Créer un design', icon: Pencil },
  { href: '/dashboard/products', label: 'Ajouter un produit', icon: Upload },
  { href: '/dashboard/ar-studio', label: 'Voir en AR', icon: Box },
  { href: '/dashboard/customize', label: 'Personnaliser', icon: Palette },
  { href: '/dashboard/configurator-3d', label: 'Configurateur 3D', icon: Layout },
  { href: '/dashboard/ai-studio', label: 'Studio IA', icon: Sparkles },
];

export function QuickActionsWidget() {
  const { currentIndustry } = useIndustryStore();

  return (
    <Card className="bg-slate-800/50 border-slate-700 text-white overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="outline"
              className={cn(
                'justify-start gap-2 h-auto py-2.5',
                'bg-slate-700/30 border-slate-600 text-slate-200 hover:bg-slate-600/50 hover:text-white'
              )}
              asChild
            >
              <Link href={href}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm">{label}</span>
              </Link>
            </Button>
          ))}
        </div>
        {currentIndustry && (
          <p className="text-xs text-slate-500 mt-3">
            Secteur : {currentIndustry.labelFr || currentIndustry.labelEn}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
