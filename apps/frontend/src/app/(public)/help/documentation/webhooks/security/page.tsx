'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function WebhookSecurityPage() {
  const [copied, setCopied] = React.useState('');
  const copyCode = (code: string, id: string) => { navigator.clipboard.writeText(code); setCopied(id); setTimeout(() => setCopied(''), 2000); };

  const example = `// Verify Webhook Signature
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  return hash === signature;
}

app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = JSON.stringify(req.body);
  
  if (!verifyWebhook(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process event
  res.json({ ok: true });
});`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Webhook Security</h1>
          <p className="text-xl text-gray-400">Vérification signatures</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Vérification</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">{example}</pre>
            <button onClick={() => copyCode(example, 'ex')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'ex' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Bonnes Pratiques</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Toujours vérifier la signature</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> HTTPS uniquement</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Timeout 30s</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Retry automatique</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

