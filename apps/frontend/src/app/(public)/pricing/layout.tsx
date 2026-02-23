import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import { generateFAQSchema } from '@/lib/seo/structured-data';
import { FAQS } from './data';

export const metadata: Metadata = {
  title: 'Tarifs & Plans | Luneo - Agents IA',
  description: 'Découvrez nos plans tarifaires flexibles. Gratuit, Pro, Business ou Enterprise : trouvez la solution agents IA adaptée à vos besoins.',
  keywords: ['tarifs', 'pricing', 'plans', 'agents IA', 'chatbot', 'SaaS', 'automatisation'],
  openGraph: {
    title: 'Tarifs & Plans | Luneo',
    description: 'Découvrez nos plans tarifaires flexibles pour vos agents IA. De Gratuit à Enterprise, trouvez la solution adaptée.',
    type: 'website',
    url: `${SEO_BASE_URL}/pricing`,
    siteName: 'Luneo',
    images: [
      {
        url: `${SEO_BASE_URL}/og-pricing.png`,
        width: 1200,
        height: 630,
        alt: 'Luneo Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs & Plans | Luneo',
    description: 'Découvrez nos plans tarifaires flexibles pour vos agents IA conversationnels.',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/pricing`,
    languages: {
      fr: `${SEO_BASE_URL}/tarifs`,
      en: `${SEO_BASE_URL}/pricing`,
    },
  },
};

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Luneo',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqPageJsonLd = generateFAQSchema(FAQS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
      />
      {children}
    </>
  );
}
