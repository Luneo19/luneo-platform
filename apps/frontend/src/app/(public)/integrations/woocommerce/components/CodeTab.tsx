'use client';

import React from 'react';
import Link from 'next/link';
import { Copy, CheckCircle2, BookOpen, Code, Play, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CodeTabProps {
  codeExamples: Record<string, string>;
  copiedCode: string | null;
  onCopyCode: (code: string, id: string) => void;
}

export function CodeTab({ codeExamples, copiedCode, onCopyCode }: CodeTabProps) {
  const tabLabels: Record<string, string> = {
    shortcode: 'Shortcode',
    gutenberg: 'Gutenberg',
    hooks: 'Hooks',
    api: 'API REST',
    ajax: 'AJAX',
    webhook: 'Webhooks',
  };

  const firstKey = Object.keys(codeExamples)[0] ?? 'shortcode';

  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Exemples de Code Complets</h3>
        <Tabs defaultValue={firstKey} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
            {Object.keys(codeExamples).map((key) => (
              <TabsTrigger key={key} value={key}>
                {tabLabels[key] || key}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(codeExamples).map(([key, code]) => (
            <TabsContent key={key} value={key} className="space-y-4 mt-0">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xl font-semibold text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <Button variant="ghost" size="sm" onClick={() => onCopyCode(code, key)}>
                    {copiedCode === key ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copier le code
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                  <pre className="text-sm text-gray-100 leading-relaxed">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <Card className="p-8 md:p-10 bg-blue-50 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <FileCode className="w-7 h-7 text-blue-600" />
          Documentation Complète
        </h3>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          Pour des exemples plus avancés, des hooks personnalisés, et des cas d&apos;usage spécifiques, consultez notre documentation complète avec plus de 50 exemples de code.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/help/documentation/integrations/woocommerce">
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation WooCommerce
            </Button>
          </Link>
          <Link href="/help/documentation/api-reference">
            <Button variant="outline" className="w-full justify-start">
              <Code className="w-4 h-4 mr-2" />
              Référence API
            </Button>
          </Link>
          <Link href="/demo/playground">
            <Button variant="outline" className="w-full justify-start">
              <Play className="w-4 h-4 mr-2" />
              API Playground
            </Button>
          </Link>
          <Link href="/help/documentation/examples">
            <Button variant="outline" className="w-full justify-start">
              <FileCode className="w-4 h-4 mr-2" />
              Plus d&apos;exemples
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
