import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentification - Luneo Enterprise',
  description: 'Connectez-vous ou créez votre compte Luneo Enterprise',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {children}
    </div>
  );
}

