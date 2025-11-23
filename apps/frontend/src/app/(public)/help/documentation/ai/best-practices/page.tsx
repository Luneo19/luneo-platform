'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function AIBestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">AI Best Practices</h1>
          <p className="text-xl text-gray-400">Optimisez vos prompts</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Lightbulb className="w-6 h-6 text-yellow-400" />Prompts Efficaces</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Soyez spécifique et descriptif</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Mentionnez le style souhaité</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Indiquez les couleurs principales</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Précisez le contexte d'utilisation</div>
          </div>
        </Card>

        <Card className="p-6 bg-green-900/20 border-green-500/30 mb-4">
          <h3 className="text-white font-bold mb-2">✅ Bon Prompt:</h3>
          <p className="text-gray-300 text-sm">"Modern minimalist logo for tech startup, blue and purple gradient, clean geometric shapes, professional, vector style"</p>
        </Card>

        <Card className="p-6 bg-red-900/20 border-red-500/30">
          <h3 className="text-white font-bold mb-2">❌ Mauvais Prompt:</h3>
          <p className="text-gray-300 text-sm">"logo"</p>
        </Card>
      </div>
    </div>
  );
}

