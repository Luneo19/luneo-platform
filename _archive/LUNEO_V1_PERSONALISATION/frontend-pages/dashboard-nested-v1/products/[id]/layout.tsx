'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ArrowLeft, Package, Palette, Box, ShoppingBag, Factory, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const tabs = [
  { label: 'Vue d\'ensemble', href: '', icon: Package },
  { label: 'Personnalisation', href: '/customize', icon: Palette },
  { label: '3D & AR', href: '/3d-ar', icon: Box },
  { label: 'Distribution', href: '/distribution', icon: ShoppingBag },
  { label: 'Production', href: '/production', icon: Factory },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const productId = params.id as string;

  const { data: product } = trpc.product.getById.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  const productName = (product as { name?: string })?.name ?? 'Produit';
  const basePath = `/dashboard/products/${productId}`;

  const activeTab = tabs.find((tab) => {
    if (tab.href === '') return pathname === basePath;
    return pathname?.startsWith(`${basePath}${tab.href}`);
  }) ?? tabs[0];

  return (
    <div className="space-y-0">
      {/* Back + Product Name */}
      <div className="mb-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux produits
        </Link>
        <h1 className="text-2xl font-bold text-white">{productName}</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.06] mb-6 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Onglets produit">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            const Icon = tab.icon;
            const href = tab.href === '' ? basePath : `${basePath}${tab.href}`;
            return (
              <Link
                key={tab.href}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
