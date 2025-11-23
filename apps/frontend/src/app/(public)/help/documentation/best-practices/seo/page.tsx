'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SEOBestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">SEO Best Practices</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Recommandations SEO</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Meta titles/descriptions uniques</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Sitemap XML généré</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Structured data JSON-LD</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> URLs canoniques</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

