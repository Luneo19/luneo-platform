'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';

function SecurityPageContent() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Security First</h1>
          <p className="text-2xl text-gray-300">Vos données sont en sécurité avec Luneo</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Lock, title: 'Chiffrement AES-256', desc: 'Données au repos chiffrées' },
            { icon: Shield, title: 'HTTPS/TLS', desc: 'Communications sécurisées' },
            { icon: Eye, title: 'Audits réguliers', desc: 'Tests de pénétration' },
            { icon: CheckCircle, title: 'Conformité RGPD', desc: 'Certifié ISO 27001' },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <item.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-gray-50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Responsible Disclosure</h2>
          <p className="text-gray-700 mb-4">Vous avez trouvé une faille de sécurité ? Contactez-nous en privé :</p>
          <a href="mailto:security@luneo.app" className="text-blue-600 hover:text-blue-700 font-semibold">security@luneo.app</a>
        </div>
      </section>
    </div>
  );
}

const SecurityPageMemo = memo(SecurityPageContent);

export default function SecurityPage() {
  return (
    <ErrorBoundary componentName="SecurityPage">
      <SecurityPageMemo />
    </ErrorBoundary>
  );
}

