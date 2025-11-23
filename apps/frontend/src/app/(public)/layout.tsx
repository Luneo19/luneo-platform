import { ZakekeStyleNav } from '@/components/navigation/ZakekeStyleNav';
import { Footer } from '@/components/layout/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <ZakekeStyleNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
