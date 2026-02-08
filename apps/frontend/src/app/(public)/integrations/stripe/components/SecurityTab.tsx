'use client';

import React from 'react';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function SecurityTab() {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-600" />
          Sécurité et conformité
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-xl">
            <Lock className="w-10 h-10 text-indigo-600 mb-3" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">PCI DSS Level 1</h4>
            <p className="text-gray-600 mb-4">Stripe est certifié PCI DSS Level 1. Les numéros de carte ne transitent pas par vos serveurs.</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />Chiffrement TLS 1.3</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />3D Secure 2.0</li>
            </ul>
          </div>
          <div className="p-6 bg-gray-50 rounded-xl">
            <Shield className="w-10 h-10 text-indigo-600 mb-3" />
            <h4 className="text-xl font-bold text-gray-900 mb-2">SOC 2 & GDPR</h4>
            <p className="text-gray-600 mb-4">Stripe est conforme SOC 2 Type II et GDPR. Données hébergées en UE possible.</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />Audits réguliers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />Stripe Radar (anti-fraude)</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
