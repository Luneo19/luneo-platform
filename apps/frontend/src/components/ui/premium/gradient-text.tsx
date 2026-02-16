'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'indigo' | 'violet' | 'cyan' | 'rose' | 'rainbow' | 'editorial';
  animate?: boolean;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p';
}

const gradients = {
  indigo: 'from-indigo-400 via-indigo-300 to-violet-400',
  violet: 'from-violet-400 via-purple-300 to-pink-400',
  cyan: 'from-cyan-400 via-blue-400 to-indigo-400',
  rose: 'from-rose-400 via-pink-300 to-purple-400',
  rainbow: 'from-indigo-400 via-purple-400 to-pink-400',
  editorial: 'from-white via-indigo-200 to-white',
};

export function GradientText({
  children,
  className,
  variant = 'indigo',
  animate = false,
  as: Tag = 'span',
}: GradientTextProps) {
  return (
    <Tag
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradients[variant],
        animate && 'animate-gradient-shift bg-[length:200%_auto]',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionBadge({ children, className }: SectionBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-1.5 rounded-full',
        'bg-indigo-500/10 border border-indigo-500/20',
        'text-indigo-300 text-sm font-medium',
        'backdrop-blur-sm',
        className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      {children}
    </div>
  );
}

interface PremiumSectionHeaderProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
  editorial?: boolean;
}

export function PremiumSectionHeader({
  badge,
  title,
  subtitle,
  align = 'center',
  className,
  editorial = false,
}: PremiumSectionHeaderProps) {
  return (
    <div
      className={cn(
        'space-y-4',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {badge && <SectionBadge>{badge}</SectionBadge>}
      <h2
        className={cn(
          'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white',
          editorial && 'font-editorial italic',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-lg sm:text-xl max-w-3xl text-white/60 leading-relaxed',
            align === 'center' && 'mx-auto',
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
