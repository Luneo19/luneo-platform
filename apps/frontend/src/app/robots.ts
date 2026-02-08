import { MetadataRoute } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/_next/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/private/'],
      },
    ],
    sitemap: `${SEO_BASE_URL}/sitemap.xml`,
  };
}