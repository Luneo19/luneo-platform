'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { TiltCard } from '@/components/ui/tilt-card';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
  color?: 'indigo' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan' | 'blue';
  badge?: string;
  delay?: number;
  staggerIndex?: number;
}

export function FeatureCard({
  icon,
  title,
  description,
  href,
  color = 'purple',
  badge,
  delay = 0,
  staggerIndex,
}: FeatureCardProps) {
  const cardClasses = `group relative bg-dark-card/60 backdrop-blur-sm p-5 sm:p-7 rounded-2xl border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 h-full ${href ? 'cursor-pointer' : ''}`;

  const content = (
    <>
      {badge && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold">
          {badge}
        </div>
      )}
      <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 flex items-center justify-center mb-4 sm:mb-5 text-purple-400 group-hover:from-purple-500/25 group-hover:to-pink-500/25 transition-colors">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">{title}</h3>
      <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-3 sm:mb-4">{description}</p>
      {href && (
        <div className="flex items-center text-purple-400 font-medium text-xs sm:text-sm group-hover:text-purple-300 transition-colors">
          En savoir plus
          <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </>
  );

  return (
    <ScrollReveal
      animation="fade-up"
      delay={delay}
      staggerIndex={staggerIndex}
      staggerDelay={80}
    >
      <TiltCard
        maxTilt={6}
        hoverScale={1.01}
        glowColor="rgba(168, 85, 247, 0.1)"
        glowSize={180}
        className="h-full rounded-2xl"
      >
        <div className={cardClasses}>
          {href ? (
            <Link href={href} className="block">
              {content}
            </Link>
          ) : (
            content
          )}
        </div>
      </TiltCard>
    </ScrollReveal>
  );
}
