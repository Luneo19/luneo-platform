'use client';

import { logger } from '@/lib/logger';

/**
 * Documentation page: the code snippet below is example code for users to copy.
 * Uses logger from @/lib/logger for integration examples.
 */
export default function WidgetDocsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">📚 Documentation Widget Luneo</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Installation</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Via CDN</h3>
              <pre className="bg-white p-4 rounded border overflow-x-auto text-sm">
{`<script src="https://cdn.luneo.app/widget/v1/luneo-widget.iife.js"></script>`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Initialisation</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <pre className="bg-white p-4 rounded border overflow-x-auto text-sm">
{`import { logger } from '@/lib/logger';

LuneoWidget.init({
  container: '#widget-container',
  apiKey: 'your-api-key',
  productId: 'product-id',
  locale: 'fr',
  theme: 'light',
  onSave: (designData) => {
    logger.info('Design saved', { designData });
  },
  onError: (error) => {
    logger.error('Error', error);
  },
  onReady: () => {
    logger.info('Widget ready');
  }
});`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">API</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">LuneoWidget.init(config)</h3>
                <p className="text-gray-600">Initialise le widget dans un conteneur</p>
              </div>
              <div>
                <h3 className="font-semibold">LuneoWidget.getDesign()</h3>
                <p className="text-gray-600">Récupère le design actuel</p>
              </div>
              <div>
                <h3 className="font-semibold">LuneoWidget.close()</h3>
                <p className="text-gray-600">Ferme le widget</p>
              </div>
              <div>
                <h3 className="font-semibold">LuneoWidget.destroy()</h3>
                <p className="text-gray-600">Détruit complètement le widget</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Configuration</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ul className="space-y-2 text-sm">
                <li><strong>container</strong>: Selector CSS ou élément DOM</li>
                <li><strong>apiKey</strong>: Clé API Luneo (requis)</li>
                <li><strong>productId</strong>: ID du produit (requis)</li>
                <li><strong>locale</strong>: Langue ('fr', 'en', etc.)</li>
                <li><strong>theme</strong>: Thème ('light', 'dark')</li>
                <li><strong>onSave</strong>: Callback lors de la sauvegarde</li>
                <li><strong>onError</strong>: Callback en cas d'erreur</li>
                <li><strong>onReady</strong>: Callback quand le widget est prêt</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}






