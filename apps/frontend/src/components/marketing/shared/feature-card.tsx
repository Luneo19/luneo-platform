'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  color?: 'indigo' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'blue';
  badge?: string;
  delay?: number;
}

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-100',
    hover: 'bg-gradient-to-br from-indigo-600 to-purple-600',
    text: 'text-indigo-600',
    border: 'border-indigo-500/20 hover:border-indigo-500/50',
  },
  purple: {
    bg: 'bg-purple-100',
    hover: 'bg-gradient-to-br from-purple-600 to-pink-600',
    text: 'text-purple-600',
    border: 'border-purple-500/20 hover:border-purple-500/50',
  },
  green: {
    bg: 'bg-green-100',
    hover: 'bg-gradient-to-br from-green-600 to-emerald-600',
    text: 'text-green-600',
    border: 'border-green-500/20 hover:border-green-500/50',
  },
  orange: {
    bg: 'bg-orange-100',
    hover: 'bg-gradient-to-br from-orange-600 to-yellow-600',
    text: 'text-orange-600',
    border: 'border-orange-500/20 hover:border-orange-500/50',
  },
  pink: {
    bg: 'bg-pink-100',
    hover: 'bg-gradient-to-br from-pink-600 to-rose-600',
    text: 'text-pink-600',
    border: 'border-pink-500/20 hover:border-pink-500/50',
  },
  cyan: {
    bg: 'bg-cyan-100',
    hover: 'bg-gradient-to-br from-cyan-600 to-blue-600',
    text: 'text-cyan-600',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
  },
  blue: {
    bg: 'bg-blue-100',
    hover: 'bg-gradient-to-br from-blue-600 to-cyan-600',
    text: 'text-blue-600',
    border: 'border-blue-500/20 hover:border-blue-500/50',
  },
};

/**
 * Feature Card Component - Reusable feature card
 * Consistent design for feature grids across pages
 */
export function FeatureCard({ 
  icon, 
  title, 
  description, 
  href,
  color = 'indigo',
  badge,
  delay = 0
}: FeatureCardProps) {
  const colors = colorClasses[color];
  const cardClasses = `bg-white p-8 rounded-2xl border border-gray-100 transition-all hover:-translate-y-2 hover:shadow-xl hover:border-transparent group ${href ? 'cursor-pointer' : ''}`;

  const content = (
    <>
      {badge && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {badge}
        </div>
      )}
      <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center mb-5 transition-all group-hover:${colors.hover} group-hover:text-white relative`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed mb-4">{description}</p>
      {href && (
        <div className="flex items-center text-indigo-600 font-medium group-hover:text-indigo-700 transition-colors">
          En savoir plus
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </>
  );

  return (
    <div
      className={cardClasses}
      data-animate="fade-up"
      data-delay={delay}
    >
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
