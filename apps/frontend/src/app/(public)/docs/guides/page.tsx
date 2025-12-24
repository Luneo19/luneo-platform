'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

function DocsGuidesPageContent() {
  const guides = [
    { title: 'Guide de démarrage rapide', href: '/help/documentation/quickstart', desc: 'Intégrez Luneo en 15 minutes' },
    { title: 'Guide Customizer', href: '/help/documentation/customizer/getting-started', desc: 'Créez votre premier customizer' },
    { title: 'Guide Configurateur 3D', href: '/help/documentation/configurator/getting-started', desc: 'Intégrez la 3D dans votre site' },
    { title: 'Guide Virtual Try-On', href: '/help/documentation/virtual-try-on/getting-started', desc: 'Ajoutez l\'AR à vos produits' },
    { title: 'Guide API', href: '/help/documentation/api-reference', desc: 'Documentation complète de l\'API' },
    { title: 'Guide Intégrations', href: '/help/documentation/integrations', desc: 'Intégrez avec Shopify, WooCommerce, etc.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Guides Luneo</h1>
          <p className="text-xl text-blue-100">Tous les guides pour démarrer avec Luneo</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Link
              key={guide.href}
              href={guide.href}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <h3 className="font-bold text-lg mb-2">{guide.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{guide.desc}</p>
              <div className="flex items-center text-blue-600 font-semibold">
                Lire le guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const DocsGuidesPageContentMemo = memo(DocsGuidesPageContent);

export default function DocsGuidesPage() {
  return (
    <ErrorBoundary componentName="DocsGuidesPage">
      <DocsGuidesPageContentMemo />
    </ErrorBoundary>
  );
}

