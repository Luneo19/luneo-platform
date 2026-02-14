import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const industryMetadata: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  printing: {
    title: 'Printing & Print-on-Demand',
    description:
      'Automatisez votre workflow print avec des fichiers prêts à imprimer. Export CMYK, gestion des marges, qualité 300 DPI pour votre business print.',
    keywords: ['printing', 'print on demand', 'CMYK', 'export print-ready', 'personnalisation', 'Luneo'],
  },
  fashion: {
    title: 'Mode & Textile',
    description:
      'Créez des collections personnalisées avec visualisation 3D. Virtual try-on, configurateur vêtements et mockups professionnels pour la mode.',
    keywords: ['mode', 'textile', 'fashion', 'virtual try-on', '3D configurator', 'personnalisation', 'Luneo'],
  },
  sports: {
    title: 'Sports & Fitness',
    description:
      'Équipements sportifs personnalisés avec AR try-on. Maillots, casquettes, chaussures custom et équipement fitness avec visualisation 3D.',
    keywords: ['sports', 'fitness', 'équipement sportif', 'AR try-on', 'personnalisation', 'Luneo'],
  },
  gifting: {
    title: 'Cadeaux & Gadgets',
    description:
      'Cadeaux personnalisés avec génération IA rapide. Gadgets promotionnels, articles de fête et souvenirs custom pour votre business.',
    keywords: ['cadeaux', 'gadgets', 'génération IA', 'personnalisation', 'Luneo'],
  },
  jewellery: {
    title: 'Bijouterie & Joaillerie',
    description:
      'Bijoux personnalisés avec rendu 3D ultra-réaliste. Bagues, colliers, bracelets custom avec visualisation photoréaliste.',
    keywords: ['bijouterie', 'joaillerie', 'bijoux', '3D', 'personnalisation', 'Luneo'],
  },
  furniture: {
    title: 'Mobilier & Décoration',
    description:
      'Meubles personnalisés avec configurateur 3D. AR placement, choix tissus et finitions pour votre showroom mobilier.',
    keywords: ['mobilier', 'décoration', 'configurateur 3D', 'AR placement', 'personnalisation', 'Luneo'],
  },
  'food-beverage': {
    title: 'Alimentaire & Boissons',
    description:
      'Packaging alimentaire personnalisé avec export print-ready. Étiquettes, bouteilles et packaging premium en CMYK.',
    keywords: ['alimentaire', 'packaging', 'étiquettes', 'print-ready', 'personnalisation', 'Luneo'],
  },
};

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = industryMetadata[slug];

  if (!meta) {
    return generateSEOMetadata({
      title: 'Industrie | Luneo',
      description:
        'Solutions de personnalisation produit par industrie. Design, IA, 3D et print-on-demand avec Luneo.',
      canonicalUrl: `${SEO_BASE_URL}/industries/${slug}`,
    });
  }

  return generateSEOMetadata({
    title: `${meta.title} | Luneo`,
    description: meta.description,
    keywords: meta.keywords,
    canonicalUrl: `${SEO_BASE_URL}/industries/${slug}`,
    ogType: 'website',
  });
}

export default function IndustrySlugLayout({ children }: { children: ReactNode }) {
  return children;
}
