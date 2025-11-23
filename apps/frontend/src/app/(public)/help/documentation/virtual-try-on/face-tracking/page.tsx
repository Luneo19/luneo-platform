'use client';

import React from 'react';
import Link from 'next/link';
import { Scan, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function FaceTrackingPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Face Tracking</h1>
          <p className="text-xl text-gray-400">Tracking facial 468 points avec MediaPipe</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Scan className="w-6 h-6 text-green-400" />Précision</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> 468 landmarks faciaux</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Détection nez, oreilles, front</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Tracking en temps réel 60 FPS</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Score de confiance par landmark</div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Use Cases</h2>
          <div className="space-y-2 text-gray-300">
            <div>🕶️ Lunettes (solaires, vue)</div>
            <div>💄 Maquillage virtuel</div>
            <div>👂 Boucles d'oreilles</div>
            <div>🎩 Chapeaux, casquettes</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

