'use client';

import { ReactNode } from 'react';
import { PageHero, SectionHeader } from './index';

interface PageWrapperProps {
  hero: {
    title: string;
    description?: string;
    badge?: string;
    gradient?: string;
    cta?: {
      label: string;
      href: string;
    };
  };
  children: ReactNode;
  showCTA?: boolean;
}

/**
 * Page Wrapper Component - Ensures consistent design across all pages
 * Wraps any page content with standard hero and optional CTA
 */
export function PageWrapper({ hero, children, showCTA = true }: PageWrapperProps) {
  return (
    <>
      <PageHero
        title={hero.title}
        description={hero.description}
        badge={hero.badge}
        gradient={hero.gradient || 'from-indigo-600 via-purple-600 to-pink-600'}
        cta={hero.cta}
      />
      {children}
      {showCTA && (
        <section className="py-24 sm:py-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'entreprises qui utilisent Luneo pour transformer leur e-commerce
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border-2 border-white/30"
              >
                Parler à un expert
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
