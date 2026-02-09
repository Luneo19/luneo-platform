'use client';

import React, { memo } from 'react';

// =============================================================================
// SVG PARTNER LOGOS - White monochrome versions
// =============================================================================

const ShopifyLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 446 127" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M386.8 44.9c-7.5 0-13.4 3.5-17.8 8.9l-.2-.1 6.5-34.1h-15.1l-16.6 87.2h15.1l5.7-29.7c2.2-11.5 8-18.6 13.5-18.6 3.9 0 5.4 2.6 5.4 6.4 0 2.3-.2 5.2-.8 7.5l-6.5 34.3h15.1l6.7-35.5c.8-3.9 1.4-8.5 1.4-11.6-.1-9.5-5-14.7-12.4-14.7zM420.3 11.1c-4.8 0-8.7 3.8-8.7 8.7 0 4.4 2.8 7.5 7 7.5h.2c4.7 0 8.8-3.2 8.9-8.7 0-4.4-2.9-7.5-7.4-7.5zM401.7 106.8h15.1L428 45.9h-15.2l-11.1 60.9zM159.1 44.9c-18.1 0-30.1 16.3-30.1 34.5 0 11.6 7.2 22.1 20.7 22.1 17.7 0 29.8-15.9 29.8-34.5 0-10.8-6.2-22.1-20.4-22.1zm-7.2 43.2c-5.1 0-7.2-4.4-7.2-9.8 0-8.5 4.4-20.2 12.4-20.2 5.4 0 6.9 4.6 6.9 9.1 0 9.2-4.5 20.9-12.1 20.9zM212.4 44.9c-10.1 0-15.8 8.9-15.8 8.9h-.2l.9-8h-13.3c-.7 6.4-2 16.1-3.2 23.4l-11.6 60.9h15.1l4.6-24.7h.4s3.1 2 8.8 2c17.6 0 29.2-18.1 29.2-36.3 0-10-4.4-18.2-15-26.2zm-15.2 43.3c-3.9 0-6.2-2.2-6.2-2.2l2.5-14.2c2-10.7 7.4-17.8 12.8-17.8 4.9 0 6.4 4.6 6.4 9 0 9.8-6.3 25.2-15.5 25.2zM99.9 106.8h15.2L126.5.4h-15.2l-11.4 106.4zM86.6 45.9h-10.5l.5-2.5c.9-5.2 4-9.9 9.2-9.9 2.7 0 4.9.8 4.9.8l3-12.2s-2.7-1.3-8.4-1.3C78 20.8 70.8 24.5 65.8 30c-6.3 7-9.2 16-10.7 25.4l-.4 2.5h-7L46 45.9h7.1l-8.9 60.9h15.1l8.9-60.9h10.4l2-12z"/>
    <path d="M292.2 45.9s-9.4 23.8-13.6 36.8h-.2c-.3-4.2-3.7-36.8-3.7-36.8h-15.9l9.1 49.3c.2 1.1.1 1.8-.3 2.5-1.8 3.5-4.8 6.8-8.4 9.3-2.9 2.1-6.1 3.4-8.6 4.4l4.2 12.8c3.1-.8 9.5-4.2 14.9-10.8 7-8.5 13.4-21.5 20-39.3l14.5-28.2h-12z"/>
    <text x="225" y="82" fontFamily="system-ui,-apple-system,sans-serif" fontSize="42" fontWeight="700" letterSpacing="-1">Stripe</text>
  </svg>
);

const WooCommerceLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.4 0h11.1C19.3 0 21.7 2.4 21.7 5.3v8.3c0 2.9-2.3 5.3-5.3 5.3h-3.1L9.9 24l-1.5-5.1H5.4c-2.9 0-5.3-2.4-5.3-5.3V5.3C.1 2.4 2.5 0 5.4 0z"/>
    <text x="26" y="16" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="700">WooCommerce</text>
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
    <text x="20" y="19" fontFamily="system-ui,-apple-system,sans-serif" fontSize="14" fontWeight="700">Printful</text>
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

const PrestaShopLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.8 2H6.3L0 22h4.6l1.9-6.2h4.6c4.5 0 7.4-2.8 7.4-6.9C18.5 4.8 15.3 2 10.8 2zm-.4 9.6H7.5L9.3 6h2.7c1.6 0 2.6.8 2.6 2.3 0 2-1.6 3.3-4.2 3.3z"/>
    <text x="20" y="19" fontFamily="system-ui,-apple-system,sans-serif" fontSize="14" fontWeight="700">PrestaShop</text>
  </svg>
);

const BigCommerceLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 150 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.5 2H14c3.5 0 6 1.5 6 4.8 0 2-1 3.4-2.7 4.2 2.3.7 3.7 2.5 3.7 5 0 3.8-2.8 6-7 6H4.5V2zm8.3 7.5c1.5 0 2.5-.7 2.5-2s-1-2-2.5-2H9v4h3.8zm.5 8c1.7 0 2.8-.8 2.8-2.3 0-1.4-1.1-2.2-2.8-2.2H9v4.5h4.3z"/>
    <text x="24" y="19" fontFamily="system-ui,-apple-system,sans-serif" fontSize="14" fontWeight="700">BigCommerce</text>
  </svg>
);

// =============================================================================
// PARTNER LOGOS MARQUEE - Two rows, infinite seamless scroll
// =============================================================================

const ROW_1 = [
  { name: 'Shopify', Logo: ShopifyLogo },
  { name: 'WooCommerce', Logo: WooCommerceLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Printful', Logo: PrintfulLogo },
  { name: 'Adobe', Logo: AdobeLogo },
  { name: 'Figma', Logo: FigmaLogo },
];

const ROW_2 = [
  { name: 'PrestaShop', Logo: PrestaShopLogo },
  { name: 'BigCommerce', Logo: BigCommerceLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Shopify', Logo: ShopifyLogo },
  { name: 'Adobe', Logo: AdobeLogo },
  { name: 'Printful', Logo: PrintfulLogo },
];

function MarqueeRow({ partners, reverse = false }: { partners: typeof ROW_1; reverse?: boolean }) {
  // Triple the logos for seamless infinite scroll (no gap)
  const logos = [...partners, ...partners, ...partners];

  return (
    <div className="relative overflow-hidden py-3 w-full min-w-0">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />

      {/* Scrolling track */}
      <div
        className={`flex items-center gap-10 sm:gap-14 md:gap-20 gpu-accelerated ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}
        style={{ width: 'max-content' }}
      >
        {logos.map((partner, i) => (
          <div
            key={`${partner.name}-${i}`}
            className="flex-shrink-0 flex items-center text-white/70 hover:text-white transition-colors duration-300"
          >
            <partner.Logo className="h-5 sm:h-6 md:h-7 w-auto max-w-[100px] sm:max-w-[130px] md:max-w-[150px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PartnerLogosInner() {
  return (
    <div className="space-y-2">
      <MarqueeRow partners={ROW_1} />
      <MarqueeRow partners={ROW_2} reverse />
    </div>
  );
}

export const PartnerLogos = memo(PartnerLogosInner);
