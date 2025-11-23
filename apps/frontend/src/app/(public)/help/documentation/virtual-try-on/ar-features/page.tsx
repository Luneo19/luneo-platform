'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ARFeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">AR Features</h1>
          <p className="text-xl text-gray-400">Export AR iOS/Android/WebXR</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Plateformes AR</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> <strong>iOS</strong>: AR Quick Look (USDZ)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>Android</strong>: Scene Viewer (GLB)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <strong>Web</strong>: WebXR API</div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Placement surface automatique</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Scale interactive</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Rotation 360°</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Screenshot/Vidéo</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

