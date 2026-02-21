'use client';

import React from 'react';
import {
  Gem,
  Glasses,
  Shirt,
  Printer,
  Sofa,
  Sparkles,
  Gift,
  Trophy,
  LayoutGrid,
} from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

// Map industry icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  gem: Gem,
  glasses: Glasses,
  shirt: Shirt,
  printer: Printer,
  sofa: Sofa,
  sparkles: Sparkles,
  gift: Gift,
  trophy: Trophy,
  'layout-grid': LayoutGrid,
};

interface IndustryCardProps {
  slug: string;
  labelFr: string;
  labelEn: string;
  icon: string;
  accentColor: string;
  description: string | null;
  isSelected: boolean;
  onClick: () => void;
}

export function IndustryCard({
  labelFr,
  labelEn,
  icon,
  accentColor,
  description,
  isSelected,
  onClick,
}: IndustryCardProps) {
  const { locale } = useI18n();
  const IconComponent = ICON_MAP[icon] || LayoutGrid;
  const label = locale === 'en' && labelEn ? labelEn : labelFr;

  return (
    <div
      onClick={() => onClick()}
      className={`p-5 rounded-2xl border text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        isSelected
          ? 'bg-white/[0.06] border-[#8b5cf6]'
          : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
      }`}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: isSelected ? `${accentColor}25` : 'rgba(255,255,255,0.06)' }}
      >
        <IconComponent className="w-7 h-7" style={{ color: isSelected ? accentColor : 'rgba(255,255,255,0.6)' }} />
      </div>
      <h3 className="font-semibold text-sm mb-1 text-white">{label}</h3>
      {description && (
        <p className="text-xs text-white/60 line-clamp-2">{description}</p>
      )}
    </div>
  );
}
