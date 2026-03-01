import sitemap from '@/app/sitemap';
import { SEO_BASE_URL } from '@/lib/seo/constants';

describe('sitemap canonical URLs', () => {
  it('n expose pas de chemins alias qui redirigent', () => {
    const entries = sitemap();
    const paths = entries.map((entry) => new URL(entry.url).pathname);
    const redirectedAliases = new Set([
      '/home',
      '/dashboard',
      '/produit',
      '/produits',
      '/solution',
      '/industrie',
      '/industries',
      '/tarifs',
      '/ressources',
      '/doc',
      '/docs',
      '/app',
      '/signup',
      '/signin',
      '/terms',
      '/privacy',
      '/entreprise',
    ]);

    for (const path of paths) {
      expect(redirectedAliases.has(path)).toBe(false);
    }
  });

  it('reste sur le domaine SEO canonique sans duplicats', () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    for (const url of urls) {
      expect(url.startsWith(SEO_BASE_URL)).toBe(true);
    }

    expect(new Set(urls).size).toBe(urls.length);
  });
});
