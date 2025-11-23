import Link from 'next/link';
import { Plug } from 'lucide-react';
export const metadata = { title: 'Integrations - Luneo' };
export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Plug className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Integrations</h1>
          <p className="text-xl text-blue-100">Connectez Luneo à vos outils préférés</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Shopify', link: '/integrations/shopify' },
            { name: 'WooCommerce', link: '/integrations/woocommerce' },
            { name: 'Printful', link: '/integrations/printful' },
            { name: 'Stripe', link: '/integrations/stripe' },
            { name: 'Zapier', link: '/integrations/zapier' },
            { name: 'Make', link: '/integrations/make' },
          ].map((integration) => (
            <Link key={integration.name} href={integration.link} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-xl">{integration.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}



