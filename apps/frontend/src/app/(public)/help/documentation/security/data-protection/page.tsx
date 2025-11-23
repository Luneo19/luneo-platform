'use client';

import React from 'react';
import Link from 'next/link';
import { Database, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DataProtectionPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Data Protection</h1>
          <p className="text-xl text-gray-400">Protection des données</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Database className="w-6 h-6 text-cyan-400" />Protection</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Encryption AES-256</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> Backups quotidiens</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> RGPD compliant</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" /> ISO 27001</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

