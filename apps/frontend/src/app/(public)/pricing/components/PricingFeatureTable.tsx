'use client';

import React, { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import type { Feature, FeatureCategory } from '../data';

const CATEGORIES: Array<{ id: FeatureCategory | 'all'; name: string }> = [
  { id: 'all', name: 'Toutes' },
  { id: 'platform', name: 'Plateforme' },
  { id: 'customization', name: 'Personnalisation' },
  { id: 'ai', name: 'IA' },
  { id: '3d', name: '3D' },
  { id: 'ar', name: 'AR' },
  { id: 'export', name: 'Export' },
  { id: 'integrations', name: 'Intégrations' },
  { id: 'collaboration', name: 'Collaboration' },
  { id: 'security', name: 'Sécurité' },
  { id: 'support', name: 'Support' },
];

export interface PricingFeatureTableProps {
  features: Feature[];
  title?: string;
  subtitle?: string;
}

function formatCell(value: boolean | string) {
  if (typeof value === 'boolean') {
    return value ? <Check className="mx-auto h-5 w-5 text-green-400" /> : <X className="mx-auto h-5 w-5 text-slate-700" />;
  }
  return <span className="text-sm font-medium text-slate-300">{value}</span>;
}

export function PricingFeatureTable({
  features,
  title = 'Comparaison complète des fonctionnalités',
  subtitle = 'Découvrez toutes les fonctionnalités disponibles sur chaque plan',
}: PricingFeatureTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    FeatureCategory | 'all'
  >('all');

  const filteredFeatures =
    selectedCategory === 'all'
      ? features
      : features.filter((f) => f.category === selectedCategory);

  return (
    <div className="overflow-x-auto">
      {(title || subtitle) && (
        <div className="mb-12 text-center">
          {title && <h2 className="text-3xl font-bold text-white font-display">{title}</h2>}
          {subtitle && <p className="mt-4 text-lg text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="border-b border-white/[0.04] bg-dark-card px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/[0.04] bg-dark-card">
            <th className="px-4 py-4 text-left text-sm font-semibold text-white">
              Fonctionnalite
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-slate-500">
              Free
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-slate-300">
              Starter
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-purple-400">
              Professional
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-slate-300">
              Business
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-slate-300">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFeatures.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-slate-500"
              >
                Aucune fonctionnalite dans cette categorie
              </td>
            </tr>
          ) : (
            filteredFeatures.map((feature) => (
              <tr
                key={feature.id}
                className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-200">
                      {feature.name}
                    </span>
                    {feature.description && (
                      <div className="group relative ml-2">
                        <Info className="h-4 w-4 cursor-help text-slate-600" />
                        <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-lg bg-dark-surface border border-white/[0.08] p-2.5 text-xs text-slate-300 shadow-xl group-hover:block">
                          {feature.description}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-4 text-center">
                  {formatCell(feature.free)}
                </td>
                <td className="px-3 py-4 text-center">
                  {formatCell(feature.starter)}
                </td>
                <td className="px-3 py-4 text-center">
                  {formatCell(feature.professional)}
                </td>
                <td className="px-3 py-4 text-center">
                  {formatCell(feature.business)}
                </td>
                <td className="px-3 py-4 text-center">
                  {formatCell(feature.enterprise)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
