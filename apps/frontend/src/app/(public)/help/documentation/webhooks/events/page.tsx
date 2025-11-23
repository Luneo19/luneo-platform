'use client';

import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function WebhookEventsPage() {
  const events = [
    { name: 'order.created', desc: 'Nouvelle commande créée' },
    { name: 'order.updated', desc: 'Statut commande modifié' },
    { name: 'design.created', desc: 'Nouveau design sauvegardé' },
    { name: 'design.shared', desc: 'Design partagé' },
    { name: 'payment.succeeded', desc: 'Paiement réussi' },
    { name: 'payment.failed', desc: 'Paiement échoué' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Webhook Events</h1>
          <p className="text-xl text-gray-400">Liste complète des événements</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" />Events</h2>
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={i} className="flex justify-between p-3 bg-gray-900 rounded-lg">
                <code className="text-purple-400 text-sm">{e.name}</code>
                <span className="text-gray-400 text-sm">{e.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
