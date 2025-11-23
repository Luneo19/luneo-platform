'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function DashboardsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Analytics Dashboards</h1>
          <p className="text-xl text-gray-400">Visualisez vos données</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Dashboards Disponibles</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Overview Dashboard</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Products Performance</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Designs Analytics</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Revenue Tracking</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
