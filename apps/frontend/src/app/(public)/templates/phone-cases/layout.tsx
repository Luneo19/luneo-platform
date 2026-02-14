import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Phone Cases Templates | Luneo',
  description:
    'Designs 3D pour coques iPhone, Samsung et plus. Créez des coques téléphone personnalisées avec le configurateur Luneo.',
  keywords: ['phone cases', 'coques téléphone', 'iPhone', 'Samsung', 'templates', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/phone-cases`,
  ogType: 'website',
});

export default function PhoneCasesTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
