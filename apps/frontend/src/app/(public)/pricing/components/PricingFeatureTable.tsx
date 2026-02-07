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
    return value ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-gray-300" />;
  }
  return <span className="text-sm font-medium text-gray-700">{value}</span>;
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
          {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
          {subtitle && <p className="mt-4 text-lg text-gray-600">{subtitle}</p>}
        </div>
      )}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Fonctionnalité
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Starter
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Professional
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Business
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFeatures.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                Aucune fonctionnalité dans cette catégorie
              </td>
            </tr>
          ) : (
            filteredFeatures.map((feature) => (
              <tr
                key={feature.id}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {feature.name}
                    </span>
                    {feature.description && (
                      <div className="group relative ml-2">
                        <Info className="h-4 w-4 cursor-help text-gray-400" />
                        <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded bg-gray-900 p-2 text-xs text-white shadow-lg group-hover:block">
                          {feature.description}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {formatCell(feature.starter)}
                </td>
                <td className="px-6 py-4 text-center">
                  {formatCell(feature.professional)}
                </td>
                <td className="px-6 py-4 text-center">
                  {formatCell(feature.business)}
                </td>
                <td className="px-6 py-4 text-center">
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
