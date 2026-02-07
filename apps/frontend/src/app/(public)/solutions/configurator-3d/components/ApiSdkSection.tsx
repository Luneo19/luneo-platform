'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Code, Webhook, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ApiSdkSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
            <Code className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Développeurs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Intégration <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Simple</span>
          </h2>
        </motion>
        <motion initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="bg-gray-900/80 border-cyan-500/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-950 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-xs text-gray-400 font-mono">configurator-3d.js</span>
            </div>
            <pre className="p-6 text-sm text-gray-300 overflow-x-auto font-mono">
{`import { Configurator3D } from '@luneo/configurator';
const config = new Configurator3D({ container: '#viewer', modelUrl: '/models/product.glb' });
config.setMaterial('gold');
config.engrave('John Doe', { font: 'Script', depth: 1.0 });
const glb = await config.exportGLB();
const usdz = await config.exportUSDZ();`}
            </pre>
          </Card>
        </motion>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
            <Code className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="font-semibold text-white">REST API</p>
            <p className="text-xs text-gray-400">Documentation complète</p>
          </Card>
          <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
            <Webhook className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="font-semibold text-white">Webhooks</p>
            <p className="text-xs text-gray-400">Events temps réel</p>
          </Card>
          <Card className="bg-gray-800/30 border-gray-700/50 p-4 text-center">
            <Globe className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <p className="font-semibold text-white">CDN Global</p>
            <p className="text-xs text-gray-400">&lt;50ms latence</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
