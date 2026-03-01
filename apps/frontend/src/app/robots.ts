import { MetadataRoute } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/callback', '/widget/', '/_next/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/callback', '/widget/', '/_next/', '/private/'],
      },
    ],
    sitemap: `${SEO_BASE_URL}/sitemap.xml`,
  };
}