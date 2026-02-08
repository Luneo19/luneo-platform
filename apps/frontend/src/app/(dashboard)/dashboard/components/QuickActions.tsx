'use client';

/**
 * Composant Actions Rapides
 * Affiche les actions principales accessibles rapidement
 */

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Plus,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Nouveau produit',
    href: '/dashboard/products?action=create',
    icon: Plus,
    description: 'Créer un produit',
  },
  {
    label: 'Voir produits',
    href: '/dashboard/products',
    icon: Package,
    description: 'Gérer les produits',
  },
  {
    label: 'Commandes',
    href: '/dashboard/orders',
    icon: ShoppingCart,
    description: 'Voir les commandes',
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Voir les analytics',
  },
  {
    label: 'AI Studio',
    href: '/dashboard/ai-studio',
    icon: Sparkles,
    description: 'Créer avec IA',
  },
  {
    label: 'Paramètres',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Configurer',
  },
];

function QuickActionsContent() {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
        <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon as React.ElementType;
            return (
              <Link key={action.href} href={action.href as string}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center gap-2 p-4 border-gray-200 hover:border-blue-500 hover:bg-blue-500/10"
                >
                  {Icon && React.createElement(Icon, { className: 'h-5 w-5' })}
                  <div className="text-center">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-gray-600">{action.description}</p>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export const QuickActions = memo(QuickActionsContent);

