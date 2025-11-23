export async function GET() {
  const baseUrl = 'https://app.luneo.app';
  const pages = [
    '', '/pricing', '/features', '/about', '/contact', '/demo',
    '/solutions/virtual-try-on', '/solutions/3d-configurator',
    '/templates', '/use-cases', '/industries', '/integrations',
    '/help/documentation', '/blog', '/changelog',
  ];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}



