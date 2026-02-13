'use client';

import { FadeIn } from '@/components/animations';

const integrations = [
  { name: 'Shopify' },
  { name: 'WooCommerce' },
  { name: 'Stripe' },
  { name: 'Zapier' },
  { name: 'Make' },
  { name: 'Printful' },
];

/**
 * Integrations Section - Logo cloud with infinite scroll
 */
export function Integrations() {
  return (
    <>
      <style jsx global>{`
        @keyframes scroll-integrations {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-integrations {
          animation: scroll-integrations 30s linear infinite;
        }
      `}</style>
      <section className="py-16 sm:py-20 bg-gray-800/50 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center mb-12">
            <p className="text-sm text-gray-300 uppercase tracking-wider mb-4">
              Intégrations
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Compatible avec vos outils préférés
            </h3>
          </FadeIn>

          {/* Infinite scroll logos */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll-integrations gap-12 items-center justify-center">
              {/* Duplicate for seamless loop */}
              {[...integrations, ...integrations].map((integration, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                >
                  <div className="w-32 h-16 flex items-center justify-center">
                    <span className="text-gray-300 text-lg font-medium">
                      {integration.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
