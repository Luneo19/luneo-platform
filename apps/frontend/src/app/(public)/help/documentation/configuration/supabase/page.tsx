'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function SupabaseConfigPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Supabase Setup</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Variables Requises</h2>
          <div className="space-y-2 text-gray-300 font-mono text-sm">
            <div><code>NEXT_PUBLIC_SUPABASE_URL</code></div>
            <div><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></div>
            <div><code>SUPABASE_SERVICE_ROLE_KEY</code></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

