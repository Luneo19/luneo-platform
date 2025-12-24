'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function EnterpriseSupportPageContent() {
  const features = useMemo(() => [
    'Account manager dédié',
    'Support 24/7 par email, chat, téléphone',
    'SLA 99.9% uptime garanti',
    'Onboarding personnalisé',
    'Formation équipe incluse'
  ], []);

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
            {features.map((feature, index) => (
              <div key={index} className="flex gap-2 items-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>{feature}</span>
              </div>
            ))}
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

const EnterpriseSupportPageMemo = memo(EnterpriseSupportPageContent);

export default function EnterpriseSupportPage() {
  return (
    <ErrorBoundary componentName="EnterpriseSupportPage">
      <EnterpriseSupportPageMemo />
    </ErrorBoundary>
  );
}
