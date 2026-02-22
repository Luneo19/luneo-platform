import TryOnWidget from '@/components/widget/TryOnWidget';

interface WidgetPageProps {
  params: Promise<{
    brandSlug: string;
    productId: string;
  }>;
}

/**
 * Standalone Widget Page for iframe/popup embedding.
 *
 * URL: /widget/try-on/[brandSlug]/[productId]
 *
 * This page is meant to be embedded via iframe on brand storefronts.
 * No authentication required (uses public API).
 *
 * Example iframe:
 * <iframe src="https://luneo.app/widget/try-on/cartier/prod_abc123" width="100%" height="600" />
 */
export default async function TryOnWidgetPage({ params }: WidgetPageProps) {
  const { brandSlug, productId } = await params;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Virtual Try-On</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #111827;
          }
        `}</style>
      </head>
      <body>
        <TryOnWidget
          brandSlug={brandSlug}
          productId={productId}
          compact={false}
          className="w-full min-h-screen"
        />
      </body>
    </html>
  );
}
