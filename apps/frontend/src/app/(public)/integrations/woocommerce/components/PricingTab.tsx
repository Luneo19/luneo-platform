'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface PricingTabProps {
  plans: PricingPlan[];
}

export function PricingTab({ plans }: PricingTabProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Transparents</h3>
        <p className="text-xl text-gray-600">Choisissez le plan qui correspond à vos besoins</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`p-8 ${plan.popular ? 'border-2 border-blue-500 shadow-xl scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="bg-blue-600 text-white text-center py-2 px-4 rounded-t-lg -mt-8 -mx-8 mb-4">
                <span className="font-bold">Le plus populaire</span>
              </div>
            )}
            <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-gray-600">{plan.period}</span>
            </div>
            <p className="text-gray-600 mb-6">{plan.description}</p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              variant={plan.popular ? 'default' : 'outline'}
              size="lg"
            >
              {plan.id === 'enterprise' ? 'Nous contacter' : 'Commencer'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
