'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle2, BookOpen, Play, FileCode, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CodeTabProps {
  codeExamples: Record<string, string>;
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}

const labels: Record<string, string> = { basic: 'Basique', catalog: 'Catalogue', order: 'Commande', webhook: 'Webhook', mockup: 'Mockup', sync: 'Synchronisation' };

export function CodeTab({ codeExamples, copiedCode, onCopyCode }: CodeTabProps) {
  const keys = Object.keys(codeExamples);
  const first = keys[0] ?? 'basic';
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Exemples de Code</h3>
        <Tabs defaultValue={first} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
            {keys.map((k) => <TabsTrigger key={k} value={k}>{labels[k] ?? k}</TabsTrigger>)}
          </TabsList>
          {keys.map((k) => (
            <TabsContent key={k} value={k} className="space-y-4 mt-0">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xl font-semibold text-gray-900 capitalize">{(labels[k] ?? k).replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <Button variant="ghost" size="sm" onClick={() => onCopyCode(codeExamples[k], k)}>
                    {copiedCode === k ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />Copié !</> : <><Copy className="w-4 h-4 mr-2" />Copier</>}
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto"><pre className="text-sm text-gray-100 leading-relaxed"><code>{codeExamples[k]}</code></pre></div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
      <Card className="p-8 md:p-10 bg-blue-50 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3"><FileCode className="w-7 h-7 text-blue-600" />Documentation</h3>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">Exemples avancés et référence API.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/help/documentation/integrations/printful"><Button variant="outline" className="w-full justify-start"><BookOpen className="w-4 h-4 mr-2" />Doc Printful</Button></Link>
          <Link href="https://developers.printful.com" target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full justify-start"><ExternalLink className="w-4 h-4 mr-2" />Printful API</Button></Link>
          <Link href="/demo/playground"><Button variant="outline" className="w-full justify-start"><Play className="w-4 h-4 mr-2" />Playground</Button></Link>
        </div>
      </Card>
    </div>
  );
}
