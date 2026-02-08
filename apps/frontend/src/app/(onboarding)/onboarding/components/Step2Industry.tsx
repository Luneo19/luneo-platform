'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { useIndustryStore } from '@/store/industry.store';
import { IndustryCard } from './IndustryCard';

interface Step2IndustryProps {
  selectedIndustry: string | null;
  onSelectIndustry: (slug: string) => void;
}

export function Step2Industry({
  selectedIndustry,
  onSelectIndustry,
}: Step2IndustryProps) {
  const { allIndustries, isLoading } = useIndustryStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <motion
      key="step2-industry"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Quel est votre secteur ? 🏢</h1>
        <p className="text-slate-400">
          Nous adapterons votre expérience selon votre industrie
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {allIndustries.map((industry) => (
          <IndustryCard
            key={industry.slug}
            slug={industry.slug}
            labelFr={industry.labelFr}
            labelEn={industry.labelEn}
            icon={industry.icon}
            accentColor={industry.accentColor}
            description={industry.description}
            isSelected={selectedIndustry === industry.slug}
            onClick={() => onSelectIndustry(industry.slug)}
          />
        ))}
      </div>
    </motion>
  );
}
