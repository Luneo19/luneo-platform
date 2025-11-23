import Link from 'next/link';
import { Webhook } from 'lucide-react';

export const metadata = {
  title: 'Webhooks - Luneo Documentation',
  description: 'Recevez des événements en temps réel via webhooks',
};

export default function WebhooksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Webhook className="w-10 h-10 text-purple-600" />
          <h1 className="text-4xl font-bold">Webhooks</h1>
        </div>
        <p className="text-xl text-gray-600">Recevez des notifications en temps réel</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Événements Disponibles</h2>
          <ul className="space-y-2">
            <li><code>design.created</code> - Nouveau design créé</li>
            <li><code>design.updated</code> - Design modifié</li>
            <li><code>design.deleted</code> - Design supprimé</li>
            <li><code>order.created</code> - Nouvelle commande</li>
            <li><code>order.completed</code> - Commande terminée</li>
            <li><code>render.completed</code> - Rendu 3D terminé</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Configuration</h2>
          <ol className="list-decimal pl-6 space-y-3">
            <li>Allez dans <strong>Settings → Webhooks</strong></li>
            <li>Cliquez sur <strong>Add Webhook</strong></li>
            <li>Entrez votre URL endpoint</li>
            <li>Sélectionnez les événements</li>
            <li>Sauvegardez et copiez le secret</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Exemple de Payload</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`{
  "event": "design.created",
  "timestamp": 1699267200,
  "data": {
    "id": "design_123",
    "name": "T-Shirt Red",
    "status": "completed",
    "url": "https://luneo.app/designs/design_123"
  }
}`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Vérification de Signature</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return hmac === signature;
}

// Dans votre endpoint
app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const isValid = verifySignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  console.log('Event:', req.body.event);
  res.status(200).send('OK');
});`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



