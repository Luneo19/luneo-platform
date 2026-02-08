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
  icon,
  accentColor,
  description,
  isSelected,
  onClick,
}: IndustryCardProps) {
  const IconComponent = ICON_MAP[icon] || LayoutGrid;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border-2 text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
        isSelected
          ? 'border-opacity-100 bg-opacity-20 shadow-lg'
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
      }`}
      style={{
        borderColor: isSelected ? accentColor : undefined,
        backgroundColor: isSelected ? `${accentColor}15` : undefined,
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${accentColor}25` }}
      >
        <IconComponent className="w-7 h-7" style={{ color: accentColor }} />
      </div>
      <h3 className="font-semibold text-sm mb-1">{labelFr}</h3>
      {description && (
        <p className="text-xs text-slate-400 line-clamp-2">{description}</p>
      )}
    </div>
  );
}
