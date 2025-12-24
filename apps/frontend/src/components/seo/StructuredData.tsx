'use client';

import React from 'react';

interface StructuredDataProps {
  data: Record<string, unknown>;
}

/**
 * Component to inject JSON-LD structured data for SEO
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface OrganizationDataProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  email?: string;
}

export function OrganizationStructuredData({
  name = 'Luneo',
  url = 'https://app.luneo.app',
  logo = 'https://app.luneo.app/logo.png',
  description = 'Plateforme de personnalisation produits avec éditeur 2D/3D, Virtual Try-On AR, et export print-ready',
  sameAs = [
    'https://twitter.com/luneo_app',
    'https://linkedin.com/company/luneo',
  ],
  email = 'contact@luneo.app',
}: OrganizationDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email,
      url: `${url}/contact`,
    },
  };

  return <StructuredData data={data} />;
}

interface ProductDataProps {
  name: string;
  description: string;
  image?: string;
  price?: string;
  priceCurrency?: string;
}

export function ProductStructuredData({
  name,
  description,
  image = 'https://app.luneo.app/og-image.png',
  price = '0',
  priceCurrency = 'EUR',
}: ProductDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: 'Luneo',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency,
      price,
      availability: 'https://schema.org/InStock',
    },
  };

  return <StructuredData data={data} />;
}

interface BreadcrumbDataProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbStructuredData({ items }: BreadcrumbDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData data={data} />;
}

interface FAQDataProps {
  questions: Array<{ question: string; answer: string }>;
}

export function FAQStructuredData({ questions }: FAQDataProps) {
  const data = {
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

  return <StructuredData data={data} />;
}




















