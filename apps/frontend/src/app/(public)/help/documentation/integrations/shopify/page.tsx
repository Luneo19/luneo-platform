import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export const metadata = {
  title: 'Shopify Integration - Luneo Documentation',
};

export default function ShopifyIntegrationDocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">← Documentation</Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <ShoppingBag className="w-10 h-10 text-green-600" />
          <h1 className="text-4xl font-bold">Shopify Integration</h1>
        </div>
        <p className="text-xl text-gray-600">Guide d'intégration Shopify</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Installation</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>Allez sur le Shopify App Store</li>
            <li>Recherchez "Luneo 3D/AR Customizer"</li>
            <li>Cliquez sur "Add app"</li>
            <li>Autorisez les permissions</li>
            <li>Configurez votre API key Luneo</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration Produit</h2>
          <div className="bg-gray-50 border-l-4 border-green-600 p-4">
            <p className="font-semibold">Dans l'admin Shopify :</p>
            <ol className="list-decimal pl-6 mt-2 space-y-2">
              <li>Ouvrez un produit</li>
              <li>Section "Luneo Customization"</li>
              <li>Sélectionnez un template</li>
              <li>Configurez les options</li>
              <li>Sauvegardez</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Code Liquid</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`<!-- Dans votre theme.liquid -->
<div id="luneo-customizer"></div>
<script>
  LuneoCustomizer.init({
    productId: {{ product.id }},
    apiKey: 'YOUR_API_KEY'
  });
</script>`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
