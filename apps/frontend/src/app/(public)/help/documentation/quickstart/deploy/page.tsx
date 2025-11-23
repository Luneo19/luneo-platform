'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Rocket, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DeployPage() {
  const [copied, setCopied] = React.useState('');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Deploy Production</h1>
          <p className="text-xl text-gray-400">Déployez sur Vercel, Netlify ou votre serveur</p>
        </div>

        {/* Vercel */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-400" />
            Vercel (Recommandé)
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 mb-2">1. Install Vercel CLI:</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
                npm i -g vercel
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCode('npm i -g vercel', 'vercel-install')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {copied === 'vercel-install' ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-gray-300 mb-2">2. Deploy:</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
                vercel --prod
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCode('vercel --prod', 'vercel-deploy')}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {copied === 'vercel-deploy' ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-gray-300 mb-2">3. Configurez vos env variables dans Vercel Dashboard</p>
            </div>
          </div>
        </Card>

        {/* Variables Production */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Variables Production</h2>
          <p className="text-gray-300 mb-4">Ajoutez ces variables dans Vercel Dashboard:</p>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> NEXT_PUBLIC_LUNEO_API_KEY</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> NEXT_PUBLIC_SUPABASE_URL</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> STRIPE_SECRET_KEY</li>
          </ul>
        </Card>

        {/* Checklist */}
        <Card className="p-6 bg-green-900/20 border-green-400/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Checklist Production</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Variables d'environnement configurées</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Build local réussi</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Tests passés</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Domain configuré</div>
          </div>
        </Card>

        {/* Next */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">Félicitations ! 🎉</h2>
          <p className="text-gray-300 mb-4">Votre customizer est en production !</p>
          <Link href="/help/documentation">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full justify-between">
              <span>Explorer la documentation</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
