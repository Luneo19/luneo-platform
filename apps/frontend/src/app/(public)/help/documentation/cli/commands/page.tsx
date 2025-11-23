'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function CLICommandsPage() {
  const commands = [
    { cmd: 'luneo init', desc: 'Initialise un nouveau projet' },
    { cmd: 'luneo dev', desc: 'Lance le serveur de développement' },
    { cmd: 'luneo build', desc: 'Build pour production' },
    { cmd: 'luneo deploy', desc: 'Déploie sur Vercel' },
    { cmd: 'luneo products list', desc: 'Liste les produits' },
    { cmd: 'luneo products create', desc: 'Crée un produit' },
    { cmd: 'luneo designs list', desc: 'Liste les designs' },
    { cmd: 'luneo designs export', desc: 'Exporte un design' },
    { cmd: 'luneo ai generate', desc: 'Génère avec IA' },
    { cmd: 'luneo webhooks list', desc: 'Liste les webhooks' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">CLI Commands</h1>
          <p className="text-xl text-gray-400">Liste complète des commandes</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Terminal className="w-6 h-6 text-green-400" />Commandes Essentielles</h2>
          <div className="space-y-2">
            {commands.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <code className="text-purple-400 font-mono text-sm">{c.cmd}</code>
                <span className="text-gray-400 text-sm">{c.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
