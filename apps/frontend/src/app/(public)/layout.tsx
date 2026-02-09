import { Navigation, FooterNew, CursorGlow } from '@/components/marketing/home';

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
      <CursorGlow />
      <Navigation />
      <main id="main-content" className="min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </main>
      <FooterNew />
    </div>
  );
}
