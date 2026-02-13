import Script from 'next/script';
import { Navigation, FooterNew, CursorGlow } from '@/components/marketing/home';
import { CartDrawer } from '@/components/cart/CartDrawer';

// ISR: Revalidate public pages every hour
export const revalidate = 3600; // 1 hour

/**
 * Public Layout - Unified layout for all public pages
 * Uses the new design system with Navigation and FooterNew
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-dark-bg">
      {/* Google model-viewer for AR fallback (Safari/iOS Quick Look, Scene Viewer) */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        type="module"
        strategy="lazyOnload"
      />
      <CursorGlow />
      <Navigation />
      <main id="main-content" className="min-h-screen flex flex-col overflow-x-hidden w-full min-w-0">
        {children}
      </main>
      <CartDrawer />
      <FooterNew />
    </div>
  );
}
