import Link from 'next/link';

export const metadata = {
  title: 'WooCommerce Integration - Luneo Documentation',
};

export default function WooCommerceDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/help/documentation" className="text-blue-600">← Documentation</Link>
      <h1 className="text-4xl font-bold mt-4 mb-2">WooCommerce Integration</h1>
      <div className="prose prose-lg">
        <h2>Installation du Plugin</h2>
        <ol>
          <li>Téléchargez le plugin depuis WordPress.org</li>
          <li>Uploadez dans /wp-content/plugins/</li>
          <li>Activez dans WP Admin → Plugins</li>
          <li>Configurez votre API key Luneo</li>
        </ol>
      </div>
    </div>
  );
}
