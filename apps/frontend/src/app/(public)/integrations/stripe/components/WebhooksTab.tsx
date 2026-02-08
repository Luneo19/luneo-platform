'use client';

import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function WebhooksTab() {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-600" />
          Configurer les webhooks Stripe
        </h3>
        <p className="text-lg text-gray-600 mb-6">
          Stripe Dashboard &gt; Développeurs &gt; Webhooks. URL: <code className="bg-gray-100 px-2 py-1 rounded">https://api.luneo.app/webhooks/stripe</code>
        </p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />payment_intent.succeeded</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />payment_intent.payment_failed</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />charge.succeeded / charge.failed</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />customer.subscription.created / updated / deleted</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" />invoice.payment_succeeded / invoice.payment_failed</li>
        </ul>
      </Card>
    </div>
  );
}
