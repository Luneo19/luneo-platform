import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '3D Configurator',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/**
 * Minimal layout for embed - no dashboard navigation, header, or footer.
 * Designed for iframe embedding with responsive viewport.
 */
export default function EmbedConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="m-0 min-h-screen overflow-hidden p-0">
      {children}
    </div>
  );
}
