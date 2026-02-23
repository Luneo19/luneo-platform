'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle2, Code, Copy, FileText, Play } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const codeExamples = {
  widget: `<!-- Ajouter le widget dans votre template produit -->
<!-- theme.liquid ou product.liquid -->

<div id="luneo-customizer" 
     data-product-id="{{ product.id }}"
     data-product-handle="{{ product.handle }}"
     data-api-key="YOUR_API_KEY">
</div>

<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://luneo.app/widget/v1/luneo-widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = function() {
      Luneo.init({
        container: '#luneo-customizer',
        productId: '{{ product.id }}',
        apiKey: 'YOUR_API_KEY',
        theme: 'shopify',
        onDesignComplete: function(design) {
          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{
                id: design.variantId,
                quantity: 1,
                properties: {
                  '_luneo_design_id': design.id,
                  '_luneo_preview_url': design.previewUrl
                }
              }]
            })
          });
        }
      });
    };
  })();
</script>`,

  webhook: `// Configuration webhook dans Shopify Admin
// Settings > Notifications > Webhooks

// URL: https://api.luneo.app/webhooks/shopify
// Format: JSON
// Events:
// - orders/create
// - orders/updated
// - products/create
// - products/update`,

  api: `// Utiliser l'API Luneo depuis votre app Shopify
const LuneoAPI = require('@luneo/shopify-sdk');

const client = new LuneoAPI({
  apiKey: process.env.LUNEO_API_KEY,
  shopDomain: 'your-shop.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});

const design = await client.designs.create({
  productId: 'shopify-product-123',
  templateId: 'template-456',
  customizations: {
    text: 'Hello World',
    color: '#FF5733',
    position: { x: 100, y: 200 }
  }
});`,
};

export function ShopifyCodeTab({
  copiedCode,
  onCopyCode,
}: {
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}) {
  const examples = useMemo(() => codeExamples, []);

  return (
    <>
      <Card className="p-6 md:p-8 bg-gray-800/50 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Exemples de Code</h3>
        <Tabs defaultValue="widget" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-700">
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="webhook">Webhooks</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          <TabsContent value="widget" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Installation du Widget</h4>
                <Button variant="ghost" size="sm" onClick={() => onCopyCode(examples.widget, 'widget')} className="text-gray-300 hover:text-white">
                  {copiedCode === 'widget' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Copié !</> : <><Copy className="w-4 h-4 mr-2" />Copier</>}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100"><code>{examples.widget}</code></pre>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="webhook" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">Configuration Webhooks</h4>
                <Button variant="ghost" size="sm" onClick={() => onCopyCode(examples.webhook, 'webhook')} className="text-gray-300 hover:text-white">
                  {copiedCode === 'webhook' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Copié !</> : <><Copy className="w-4 h-4 mr-2" />Copier</>}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100"><code>{examples.webhook}</code></pre>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="api" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">API SDK</h4>
                <Button variant="ghost" size="sm" onClick={() => onCopyCode(examples.api, 'api')} className="text-gray-300 hover:text-white">
                  {copiedCode === 'api' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Copié !</> : <><Copy className="w-4 h-4 mr-2" />Copier</>}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100"><code>{examples.api}</code></pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="p-6 md:p-8 bg-blue-50 border-2 border-blue-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          Documentation Complète
        </h3>
        <p className="text-gray-700 mb-4">
          Pour des exemples plus avancés et des cas d&apos;usage spécifiques, consultez notre documentation complète.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/help/documentation/integrations/shopify">
            <Button variant="outline" className="w-full sm:w-auto">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation Shopify
            </Button>
          </Link>
          <Link href="/help/documentation/api-reference">
            <Button variant="outline" className="w-full sm:w-auto">
              <Code className="w-4 h-4 mr-2" />
              Référence API
            </Button>
          </Link>
          <Link href="/demo/playground">
            <Button variant="outline" className="w-full sm:w-auto">
              <Play className="w-4 h-4 mr-2" />
              API Playground
            </Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
