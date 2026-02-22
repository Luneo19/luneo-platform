'use client';

import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

interface SectionHeaderProps {
  tag?: string;
  title: string;
  description?: string;
  centered?: boolean;
  gradient?: string;
}

export function SectionHeader({
  tag,
  title,
  description,
  centered = true,
  gradient = 'from-purple-500 to-pink-500',
}: SectionHeaderProps) {
  const containerClass = centered
    ? 'text-center max-w-2xl mx-auto mb-10 sm:mb-16'
    : 'mb-10 sm:mb-16';

  return (
    <ScrollReveal animation="fade-up">
      <div className={containerClass}>
        {tag && (
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] sm:text-xs font-semibold rounded-full mb-4 sm:mb-5 uppercase tracking-wider">
            {tag}
          </span>
        )}
        <h2 className="heading-section text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 text-white">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-white/80 body-text px-2">
            {description}
          </p>
        )}
      </div>
    </ScrollReveal>
  );
}
