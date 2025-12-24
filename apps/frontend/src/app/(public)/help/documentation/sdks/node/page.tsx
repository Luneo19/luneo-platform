'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function NodeSDKPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const serverExample = useMemo(() => `const { LuneoClient } = require('@luneo/sdk');

const client = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY
});

// Express route
app.post('/api/create-design', async (req, res) => {
  const design = await client.designs.create({
    product_id: req.body.productId,
    canvas_data: req.body.canvasData
  });
  
  res.json({ design });
});`, []);

  const webhookExample = `// Webhook verification
const crypto = require('crypto');

app.post('/webhooks/luneo', (req, res) => {
  const signature = req.headers['x-luneo-signature'];
  const payload = JSON.stringify(req.body);
  
  const hash = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Invalid');
  }
  
  logger.info('Event:', req.body.type);
  res.json({ ok: true });
});`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Node.js SDK</h1>
          <p className="text-xl text-gray-400">SDK pour applications backend Node.js</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Server-Side Usage</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {serverExample}
            </pre>
            <button onClick={() => copyCode(serverExample, 'server')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'server' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Webhooks</h2>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {webhookExample}
            </pre>
            <button onClick={() => copyCode(webhookExample, 'webhook')} className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">
              {copied === 'webhook' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
