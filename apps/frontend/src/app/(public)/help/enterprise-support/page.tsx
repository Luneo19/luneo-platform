'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EnterpriseSupportPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Enterprise Support</h1>
          <p className="text-xl text-gray-400">Support premium 24/7 pour entreprises</p>
        </div>

        <Card className="p-8 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Inclus</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Account manager dédié</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Support 24/7 par email, chat, téléphone</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> SLA 99.9% uptime garanti</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Onboarding personnalisé</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Formation équipe incluse</div>
          </div>
        </Card>

        <div className="text-center">
          <Link href="/contact">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 h-12 text-lg">
              Contacter notre équipe
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
