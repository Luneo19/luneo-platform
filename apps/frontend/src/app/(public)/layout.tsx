import { ClerkStyleNav } from '@/components/navigation/ClerkStyleNav';
import { Footer } from '@/components/layout/Footer';

// ISR: Revalidate public pages every hour
export const revalidate = 3600; // 1 hour

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <ClerkStyleNav />
      <main id="main-content" className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
