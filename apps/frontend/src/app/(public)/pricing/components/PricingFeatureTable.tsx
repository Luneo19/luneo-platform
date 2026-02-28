'use client';

import React, { useState } from 'react';
import { Check, X, Info } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { Feature, FeatureCategory } from '../data';

const CATEGORY_IDS: Array<FeatureCategory | 'all'> = [
  'all', 'agents', 'conversations', 'knowledge', 'channels',
  'analytics', 'security', 'support',
];

export interface PricingFeatureTableProps {
  features: Feature[];
  title?: string;
  subtitle?: string;
}

function formatCell(value: boolean | string) {
  if (typeof value === 'boolean') {
    return value ? <Check className="mx-auto h-5 w-5 text-green-400" /> : <X className="mx-auto h-5 w-5 text-slate-300" />;
  }
  return <span className="text-sm font-medium text-white">{value}</span>;
}

export function PricingFeatureTable({
  features,
  title,
  subtitle,
}: PricingFeatureTableProps) {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<
    FeatureCategory | 'all'
  >('all');

  const displayTitle = title ?? t('pricing.featureTable.title');
  const displaySubtitle = subtitle ?? t('pricing.featureTable.subtitle');

  const filteredFeatures =
    selectedCategory === 'all'
      ? features
      : features.filter((f) => f.category === selectedCategory);

  return (
    <div className="overflow-x-auto">
      {(displayTitle || displaySubtitle) && (
        <div className="mb-12 text-center">
          {displayTitle && <h2 className="text-3xl font-bold text-white font-display">{displayTitle}</h2>}
          {displaySubtitle && <p className="mt-4 text-lg text-white/90">{displaySubtitle}</p>}
        </div>
      )}
      <div className="border-b border-white/[0.04] bg-dark-card px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_IDS.map((catId) => (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === catId
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/[0.08] text-white/90 hover:bg-white/[0.16] hover:text-white'
              }`}
            >
              {t(`pricing.categories.${catId}`)}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/[0.04] bg-dark-card">
            <th className="px-4 py-4 text-left text-sm font-semibold text-white">
              {t('pricing.featureTable.feature')}
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-white/90">
              Gratuit
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-purple-400">
              Pro
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-white/90">
              Business
            </th>
            <th className="px-3 py-4 text-center text-sm font-semibold text-white/90">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFeatures.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-8 text-center text-sm text-white/90"
              >
                {t('pricing.featureTable.noFeatures')}
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
                    <span className="text-sm font-medium text-white">
                      {feature.name}
                    </span>
                    {feature.description && (
                      <div className="group relative ml-2">
                        <Info className="h-4 w-4 cursor-help text-slate-300" />
                        <div className="absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-lg bg-dark-surface border border-white/[0.16] p-2.5 text-xs text-white/90 shadow-xl group-hover:block">
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
                  {formatCell(feature.pro)}
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
