/**
 * SEO Metadata Helper
 * Inspired by Vercel and Shopify SEO best practices
 */

import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
}

const DEFAULT_IMAGE = '/og-image.png';
const DEFAULT_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
const SITE_NAME = 'Luneo - Plateforme SaaS de Personnalisation IA';

/**
 * Generate complete SEO metadata
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
    noindex = false,
    nofollow = false,
  } = config;

  const fullTitle = `${title} | ${SITE_NAME}`;
  const fullUrl = url ? `${DEFAULT_URL}${url}` : DEFAULT_URL;
  const fullImage = image.startsWith('http') ? image : `${DEFAULT_URL}${image}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    authors: author ? [{ name: author }] : undefined,
    creator: SITE_NAME,
    publisher: SITE_NAME,
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      url: fullUrl,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'fr_FR',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullImage],
      creator: '@luneo_app',
      site: '@luneo_app',
    },
    alternates: {
      canonical: fullUrl,
    },
    other: {
      'apple-mobile-web-app-title': SITE_NAME,
      'application-name': SITE_NAME,
      'msapplication-TileColor': '#0071e3',
      'theme-color': '#0071e3',
    },
  };
}

/**
 * Generate JSON-LD structured data
 */
export function generateStructuredData(config: {
  type: 'Organization' | 'WebSite' | 'Product' | 'Article' | 'BreadcrumbList';
  data: Record<string, any>;
}): object {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': config.type,
    ...config.data,
  };

  return baseSchema;
}

/**
 * Organization structured data
 */
export function getOrganizationSchema() {
  return generateStructuredData({
    type: 'Organization',
    data: {
      name: 'Luneo',
      url: DEFAULT_URL,
      logo: `${DEFAULT_URL}/logo.png`,
      description: 'Plateforme SaaS de personnalisation de produits avec IA',
      sameAs: [
        'https://twitter.com/luneo_app',
        'https://linkedin.com/company/luneo',
        'https://github.com/luneo',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        email: 'contact@luneo.app',
      },
    },
  });
}

/**
 * Website structured data
 */
export function getWebsiteSchema() {
  return generateStructuredData({
    type: 'WebSite',
    data: {
      name: SITE_NAME,
      url: DEFAULT_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${DEFAULT_URL}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  });
}
