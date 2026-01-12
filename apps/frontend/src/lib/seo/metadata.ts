/**
 * SEO Metadata Helper
 * Centralized SEO metadata generation for all pages
 */

import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
  alternateLocales?: Array<{ locale: string; url: string }>;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

const defaultConfig = {
  siteName: 'Luneo Platform',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app',
  defaultOgImage: '/og-image.png',
  defaultLocale: 'fr_FR',
  twitterHandle: '@luneo_app',
  googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
};

/**
 * Generate comprehensive SEO metadata
 */
export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage = defaultConfig.defaultOgImage,
    ogType = 'website',
    noindex = false,
    nofollow = false,
    locale = defaultConfig.defaultLocale,
    alternateLocales = [],
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
  } = config;

  const fullTitle = title.includes('Luneo') ? title : `${title} | Luneo Platform`;
  const canonical = canonicalUrl || `${defaultConfig.siteUrl}${canonicalUrl || ''}`;
  const ogImageUrl = ogImage.startsWith('http') ? ogImage : `${defaultConfig.siteUrl}${ogImage}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    authors: author ? [{ name: author }] : [{ name: 'Luneo Team' }],
    creator: 'Luneo',
    publisher: 'Luneo',
    metadataBase: new URL(defaultConfig.siteUrl),
    alternates: {
      canonical,
      languages: alternateLocales.reduce(
        (acc, alt) => {
          acc[alt.locale] = alt.url;
          return acc;
        },
        { [locale]: canonical } as Record<string, string>
      ),
    },
    openGraph: {
      type: ogType,
      locale,
      url: canonical,
      siteName: defaultConfig.siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
      creator: defaultConfig.twitterHandle,
    },
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
    ...(defaultConfig.googleSiteVerification && {
      verification: {
        google: defaultConfig.googleSiteVerification,
      },
    }),
  };

  return metadata;
}

/**
 * Generate metadata for product pages
 */
export function generateProductMetadata(product: {
  name: string;
  description: string;
  image?: string;
  price?: number;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  brand?: string;
  category?: string;
}): Metadata {
  return generateMetadata({
    title: product.name,
    description: product.description,
    keywords: [
      product.name,
      product.category || '',
      'personnalisation produits',
      'customizer',
      'product configurator',
    ].filter(Boolean),
    ogType: 'product',
    ogImage: product.image,
  });
}

/**
 * Generate metadata for article/blog pages
 */
export function generateArticleMetadata(article: {
  title: string;
  description: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}): Metadata {
  return generateMetadata({
    title: article.title,
    description: article.description,
    keywords: article.tags,
    ogType: 'article',
    ogImage: article.image,
    publishedTime: article.publishedTime,
    modifiedTime: article.modifiedTime,
    author: article.author,
    section: article.section,
    tags: article.tags,
  });
}

// Export aliases for backward compatibility
export const generateSEOMetadata = generateMetadata;
export { getDefaultOrganizationSchema as getOrganizationSchema } from './schema';
export { getDefaultWebSiteSchema as getWebsiteSchema } from './schema';
