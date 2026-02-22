'use client';

import { FadeIn } from '@/components/animations/fade-in';

export function SocialProofSection() {
  return (
    <section className="py-16 border-t border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-sm text-white/30 mb-8 tracking-wider uppercase">
            Fait confiance par des entreprises innovantes
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {['Shopify', 'Stripe', 'HubSpot', 'Slack', 'Zendesk', 'Intercom'].map((name) => (
              <span key={name} className="text-lg font-semibold text-white/60 tracking-wide">
                {name}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
