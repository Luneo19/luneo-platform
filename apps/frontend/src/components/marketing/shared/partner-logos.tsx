'use client';

import React, { memo } from 'react';

// =============================================================================
// SVG PARTNER LOGOS - White monochrome versions
// =============================================================================

const ShopifyLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 109 124" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M95.8 28.2c-.1-.6-.6-1-1.1-1-.5 0-10.4-.8-10.4-.8s-6.9-6.9-7.7-7.6c-.7-.7-2.2-.5-2.7-.4-.1 0-1.5.5-3.8 1.2-2.3-6.6-6.3-12.6-13.3-12.6h-.6c-2-2.6-4.5-3.8-6.6-3.8C34.4 3.2 27.1 27.5 24.8 39.6c-6 1.9-10.3 3.2-10.8 3.3-3.4 1.1-3.5 1.2-3.9 4.4C9.8 49.8 0 124.3 0 124.3l75.6 13.1 40.5-10.2S95.9 28.8 95.8 28.2zM67.6 21.2l-5.8 1.8c0-3.2-.4-7.8-1.8-11.7 4.5.8 6.7 5.9 7.6 9.9zM56 24.7l-12.5 3.9c1.2-4.6 3.5-9.2 6.3-12.2 1-.1 2.4 2.6 2.4 2.6s2.3-2 3.5-.8c.1 1.9.3 4.2.3 6.5zM49.9 3.5c1.1 0 2 .4 2.8 1.1-4 1.9-8.3 6.7-10.1 16.2l-9.9 3.1C35.3 13.5 41.8 3.5 49.9 3.5z"/>
  </svg>
);

const WooCommerceLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.4 0h11.1C19.3 0 21.7 2.4 21.7 5.3v8.3c0 2.9-2.3 5.3-5.3 5.3h-3.1L9.9 24l-1.5-5.1H5.4c-2.9 0-5.3-2.4-5.3-5.3V5.3C.1 2.4 2.5 0 5.4 0zm2.8 11.8c-.1.6-.6.9-1.1.8-.5-.2-.9-.7-.8-1.3.5-3 .6-5.5.4-7.4l-.1-.4c-.6.1-1.1 1-1.5 2.5-.6 1.9-1.1 4.2-1.6 7l-.1.3c-.2.5-.6.8-1.1.7-.4-.1-.8-.5-.9-1C2.7 10.3 2 7.6 1.3 5.1c-.2-.8 0-1.3.5-1.5.5-.2 1.1 0 1.3.7.5 1.7.9 3.3 1.3 4.8.5-1.9 1-3.6 1.5-4.9.4-1 1.1-1.4 1.8-1.2.7.3 1 1 .9 2.1-.2 2-.2 4.1-.1 6.1.5-1.7 1.1-3.3 1.8-4.8.3-.6.8-.8 1.3-.5.5.3.6.9.3 1.5-.9 1.8-1.6 4-2.2 6.4l-.4.1zM19.2 8c-.3-1.7-1.1-2.7-2.3-3.1-1.9-.6-3.5.5-4.4 3-.7 1.9-.7 3.7 0 5.3.5 1.3 1.5 2 2.6 2 .2 0 .3 0 .5-.1 1.3-.3 2.2-1.2 2.8-2.7.5-1.3.6-2.5.4-3.6l.4-.8zm-3.2 3.9c-.3.7-.7 1.2-1.2 1.3-.7.2-1.2-.4-1.5-1.6-.2-.8-.2-1.5-.1-2.3.2-1.1.6-1.8 1.2-2 .1 0 .2 0 .3 0 .5 0 .8.5 1.1 1.4.3 1 .3 2.1.2 3.2z"/>
    <text x="24" y="17" fontFamily="system-ui" fontSize="14" fontWeight="700">WooCommerce</text>
  </svg>
);

const StripeLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 60 25" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 10.3c0-.6.5-.8 1.3-.8 1.1 0 2.6.4 3.8 1V6.8c-1.3-.5-2.5-.7-3.8-.7C2.7 6.1 0 8.1 0 11.5c0 5.2 7.2 4.4 7.2 6.6 0 .7-.6 1-1.5 1-1.3 0-2.9-.5-4.2-1.2v3.8c1.4.6 2.9.9 4.2.9 3.7 0 6.3-1.8 6.3-5.3 0-5.6-7.2-4.6-7-6zM15.1 2.5l-3.6.8V7H15v3.3h-3.5V16c0 2.9 2.3 4.2 4.4 4.2.8 0 1.5-.1 2.1-.4V16c-.4.2-.9.3-1.5.3-.9 0-1.5-.4-1.5-1.5v-4.5H18V6.9h-2.9V2.5zM22.5 8.2l-.2-1.3h-3.2v13.5h3.7v-9.2c.9-1.2 2.4-1 2.8-.8V6.9c-.5-.2-2.2-.5-3.1 1.3zM27 6.9h3.7v13.5H27V6.9zm0-2.1l3.7-.8V.5L27 1.3V4.8zM37.2 6.2c-1.5 0-2.5.7-3 1.2l-.2-1h-3.2v18.1l3.7-.8v-4.4c.6.4 1.4.7 2.4.7 2.4 0 4.6-2 4.6-6.2 0-3.9-2.2-6.4-4.3-5.6zm-.8 10.3c-.8 0-1.3-.3-1.6-.7v-5.5c.3-.4.9-.7 1.6-.7 1.3 0 2.1 1.4 2.1 3.4 0 2-.8 3.5-2.1 3.5zM50.4 6.2c-3.7 0-6 3.1-6 6.5 0 4.3 2.7 6.4 6.5 6.4 1.9 0 3.3-.4 4.3-1.1v-2.9c-1 .5-2.2.8-3.7.8-1.5 0-2.8-.5-2.9-2.3h7.4c0-.2 0-1 0-1 0-4.2-2-6.4-5.6-6.4zm-2.2 5.2c0-1.7 1-2.4 2-2.4s1.9.7 1.9 2.4h-3.9z"/>
  </svg>
);

const PrintfulLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.8 2H6.3L0 22h4.6l1.9-6.2h4.6c4.5 0 7.4-2.8 7.4-6.9C18.5 4.8 15.3 2 10.8 2zm-.4 9.6H7.5L9.3 6h2.7c1.6 0 2.6.8 2.6 2.3 0 2-1.6 3.3-4.2 3.3z"/>
    <text x="20" y="19" fontFamily="system-ui" fontSize="14" fontWeight="700">Printful</text>
  </svg>
);

const AdobeLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 30 26" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 0h11v26L19 0zM11 0H0v26L11 0zM15 9.6L22.1 26h-4.5l-2.1-5.4h-5.2L15 9.6z"/>
  </svg>
);

const FigmaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 38 57" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
    <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
    <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
    <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
    <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
  </svg>
);

// =============================================================================
// PARTNER LOGOS MARQUEE
// =============================================================================

const PARTNERS = [
  { name: 'Shopify', Logo: ShopifyLogo },
  { name: 'WooCommerce', Logo: WooCommerceLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Printful', Logo: PrintfulLogo },
  { name: 'Adobe', Logo: AdobeLogo },
  { name: 'Figma', Logo: FigmaLogo },
];

function PartnerLogosInner() {
  // Double the logos for infinite scroll effect
  const allLogos = [...PARTNERS, ...PARTNERS];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-dark-bg to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-dark-bg to-transparent z-10" />

      {/* Scrolling track */}
      <div className="flex animate-marquee gap-12 sm:gap-16 md:gap-20 items-center gpu-accelerated">
        {allLogos.map((partner, i) => (
          <div
            key={`${partner.name}-${i}`}
            className="flex-shrink-0 flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors duration-300"
          >
            <partner.Logo className="h-6 sm:h-7 md:h-8 w-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export const PartnerLogos = memo(PartnerLogosInner);
