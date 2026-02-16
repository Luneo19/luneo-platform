import { Navigation, FooterNew } from '@/components/marketing/home';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CustomCursor } from '@/components/ui/premium/custom-cursor';
import { ElectricGridCSS } from '@/components/ui/premium/electric-grid';
// ISR: Revalidate public pages every hour
export const revalidate = 3600; // 1 hour

/**
 * Public Layout - Unified layout for all public pages
 * Uses the new premium design system with Navigation and FooterNew
 * Includes global Madgicx-style electric grid background
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-dark-bg relative">
      {/* Global electric grid background (Madgicx-style) */}
      <ElectricGridCSS variant="fade" cellSize={80} animated={true} />
      <CustomCursor color="#6366f1" />
      <Navigation />
      <main id="main-content" className="relative min-h-screen flex flex-col overflow-x-hidden w-full min-w-0">
        {children}
      </main>
      <CartDrawer />
      <FooterNew />
    </div>
  );
}