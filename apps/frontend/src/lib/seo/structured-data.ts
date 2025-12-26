/**
 * Structured Data (JSON-LD) for SEO
 * Schema.org markup for better search engine understanding
 */

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': string;
    contactType: string;
    email?: string;
    url?: string;
  };
}

export interface WebSiteSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image?: string;
  brand?: {
    '@type': string;
    name: string;
  };
  offers?: {
    '@type': string;
    priceCurrency: string;
    price: string;
    availability: string;
  };
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item: string;
  }>;
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Luneo',
    url: 'https://luneo.app',
    logo: 'https://luneo.app/logo.png',
    description: 'Plateforme de personnalisation produits avec éditeur 2D/3D, Virtual Try-On AR, et export print-ready',
    sameAs: [
      'https://twitter.com/luneo_app',
      'https://linkedin.com/company/luneo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'contact@luneo.app',
      url: 'https://luneo.app/contact',
    },
  };
}

/**
 * Generate Website schema with search action
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Luneo Platform',
    url: 'https://luneo.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://luneo.app/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Product schema for a solution page
 */
export function generateProductSchema(
  name: string,
  description: string,
  image?: string
): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    image: image || 'https://luneo.app/og-image.png',
    brand: {
      '@type': 'Brand',
      name: 'Luneo',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      price: '0',
      availability: 'https://schema.org/InStock',
    },
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  questions: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}






















