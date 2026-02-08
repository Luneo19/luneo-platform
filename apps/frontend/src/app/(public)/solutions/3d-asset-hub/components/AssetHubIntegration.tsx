'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileType, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

const API_CODE = `// Upload asset
const response = await fetch('/api/v1/assets/upload', {
  method: 'POST',
  body: formData
});

// Optimize
await fetch('/api/v1/assets/optimize', {
  method: 'POST',
  body: JSON.stringify({
    assetId: 'asset_123',
    options: {
      mesh: { reduction: 0.5 },
      textures: { format: 'webp' },
      lod: { levels: 4 }
    }
  })
});

// Convert
await fetch('/api/v1/assets/convert', {
  method: 'POST',
  body: JSON.stringify({
    assetId: 'asset_123',
    format: 'usdz'
  })
});`;

const WEBHOOK_CODE = `{
  "event": "asset.optimized",
  "data": {
    "id": "asset_123",
    "originalSize": "45.2 MB",
    "optimizedSize": "4.8 MB",
    "reduction": "89.4%",
    "formats": ["glb", "usdz"],
    "cdnUrl": "https://cdn.luneo.app/..."
  }
}`;

export function AssetHubIntegration() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Intégration Simple
          </h2>
          <p className="text-xl text-gray-300">
            API REST complète + SDK JavaScript + Webhooks
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-900/50 border-blue-500/20 p-8">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <FileType className="w-6 h-6 text-blue-400" />
              API REST
            </h3>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{API_CODE}</pre>
            </div>
          </Card>
          <Card className="bg-gray-900/50 border-purple-500/20 p-8">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-purple-400" />
              Webhooks
            </h3>
            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{WEBHOOK_CODE}</pre>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
