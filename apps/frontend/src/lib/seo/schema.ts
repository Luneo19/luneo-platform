/**
 * Structured Data (Schema.org) Helper
 * Generate JSON-LD structured data for SEO
 */

import { SEO_BASE_URL } from './constants';

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  contactPoint?: {
    telephone?: string;
    contactType: string;
    email?: string;
  };
  sameAs?: string[]; // Social media profiles
}

export interface WebSiteSchema {
  name: string;
  url: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface ProductSchema {
  name: string;
  description: string;
  image?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers?: {
    '@type': 'Offer';
    price: number;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author?: {
    '@type': 'Person';
    name: string;
  };
  publisher?: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
}

export interface BreadcrumbSchema {
  items: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema(config: OrganizationSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    ...(config.logo && {
      logo: config.logo,
    }),
    ...(config.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...config.contactPoint,
      },
    }),
    ...(config.sameAs && config.sameAs.length > 0 && {
      sameAs: config.sameAs,
    }),
  };

  return JSON.stringify(schema);
}

/**
 * Generate Website JSON-LD schema
 */
export function generateWebSiteSchema(config: WebSiteSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: config.url,
    ...(config.potentialAction && {
      potentialAction: config.potentialAction,
    }),
  };

  return JSON.stringify(schema);
}

/**
 * Generate Product JSON-LD schema
 */
export function generateProductSchema(config: ProductSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description: config.description,
    ...(config.image && {
      image: config.image,
    }),
    ...(config.brand && {
      brand: config.brand,
    }),
    ...(config.offers && {
      offers: config.offers,
    }),
  };

  return JSON.stringify(schema);
}

/**
 * Generate Article JSON-LD schema
 */
export function generateArticleSchema(config: ArticleSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: config.headline,
    description: config.description,
    ...(config.image && {
      image: config.image,
    }),
    datePublished: config.datePublished,
    ...(config.dateModified && {
      dateModified: config.dateModified,
    }),
    ...(config.author && {
      author: config.author,
    }),
    ...(config.publisher && {
      publisher: config.publisher,
    }),
  };

  return JSON.stringify(schema);
}

/**
 * Generate BreadcrumbList JSON-LD schema
 */
export function generateBreadcrumbSchema(config: BreadcrumbSchema): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: config.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return JSON.stringify(schema);
}

/**
 * Generate FAQPage JSON-LD schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return JSON.stringify(schema);
}

/**
 * Default Luneo Organization schema
 */
export function getDefaultOrganizationSchema(): string {
  const siteUrl = SEO_BASE_URL;

  return generateOrganizationSchema({
    name: 'Luneo',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    contactPoint: {
      contactType: 'Customer Service',
      email: 'contact@luneo.app',
    },
    sameAs: [
      'https://twitter.com/luneo_app',
      'https://linkedin.com/company/luneo',
      'https://github.com/luneo',
    ],
  });
}

/**
 * Default Luneo Website schema
 */
export function getDefaultWebSiteSchema(): string {
  const siteUrl = SEO_BASE_URL;

  return generateWebSiteSchema({
    name: 'Luneo Platform',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}
