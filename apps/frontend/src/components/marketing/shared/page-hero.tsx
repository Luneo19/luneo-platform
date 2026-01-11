'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PageHeroProps {
  title: string;
  description?: string;
  badge?: string;
  cta?: {
    label: string;
    href: string;
  };
  gradient?: string;
}

/**
 * Page Hero Component - Reusable hero section for all pages
 * Consistent design across all public pages
 */
export function PageHero({ 
  title, 
  description, 
  badge, 
  cta,
  gradient = 'from-indigo-600 via-purple-600 to-pink-600'
}: PageHeroProps) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`gradient-orb absolute w-[600px] h-[600px] bg-gradient-to-br ${gradient} top-[-200px] right-[-100px] animate-float opacity-30`} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 pl-3 pr-4 bg-indigo-100 border border-indigo-200 rounded-full text-sm font-medium text-indigo-700 mb-6 shadow-sm"
              data-animate="fade-up"
            >
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              {badge}
            </div>
          )}

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight"
            data-animate="fade-up"
            data-delay="100"
          >
            {title.split(' ').map((word, i) => {
              if (i === title.split(' ').length - 1) {
                return (
                  <span key={i} className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                    {word}
                  </span>
                );
              }
              return <span key={i}>{word} </span>;
            })}
          </h1>

          {description && (
            <p
              className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
              data-animate="fade-up"
              data-delay="200"
            >
              {description}
            </p>
          )}

          {cta && (
            <div data-animate="fade-up" data-delay="300">
              <Link href={cta.href}>
                <Button
                  size="lg"
                  className={`bg-gradient-to-r ${gradient} hover:opacity-90 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all`}
                >
                  {cta.label}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
