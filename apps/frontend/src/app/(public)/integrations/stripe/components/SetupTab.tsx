'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2, Copy, ArrowRight, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface InstallationStep {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  details: string[];
  code?: string;
}

interface SetupTabProps {
  installationSteps: InstallationStep[];
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}

const borders = ['border-indigo-500', 'border-green-500', 'border-purple-500', 'border-pink-500', 'border-green-500'];
const grads = ['from-indigo-500 to-indigo-600', 'from-green-500 to-green-600', 'from-purple-500 to-purple-600', 'from-pink-500 to-pink-600', 'from-green-500 to-green-600'];

export function SetupTab({ installationSteps, copiedCode, onCopyCode }: SetupTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Guide d&apos;Installation Stripe</h3>
        <div className="space-y-8">
          {installationSteps.map((step, i) => (
            <div key={i} className={`border-l-4 pl-8 ${borders[i % borders.length]}`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${grads[i % grads.length]} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg`}>{step.number}</div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">{step.icon}{step.title}</h4>
                  <p className="text-lg text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                  <ul className="space-y-2 mb-4">
                    {step.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-gray-600"><ChevronRight className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" /><span>{d}</span></li>
                    ))}
                  </ul>
                  {step.code && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Exemple:</span>
                        <Button variant="ghost" size="sm" onClick={() => onCopyCode(step.code!, `step-${i}`)}>
                          {copiedCode === `step-${i}` ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />Copié !</> : <><Copy className="w-4 h-4 mr-2" />Copier</>}
                        </Button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto"><pre className="text-sm text-gray-100"><code>{step.code}</code></pre></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-8 md:p-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-green-600" />Configuration terminée !</h3>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">Stripe est configuré. Testez avec les cartes de test Stripe.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/integrations"><Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">Dashboard<ArrowRight className="w-5 h-5 ml-2" /></Button></Link>
          <Link href="/help/documentation/integrations/stripe"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><BookOpen className="w-5 h-5 mr-2" />Documentation</Button></Link>
          <Link href="/contact"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><MessageSquare className="w-5 h-5 mr-2" />Support</Button></Link>
        </div>
      </Card>
    </div>
  );
}
