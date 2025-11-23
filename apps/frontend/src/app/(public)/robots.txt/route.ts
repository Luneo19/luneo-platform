export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: https://app.luneo.app/sitemap.xml`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}



