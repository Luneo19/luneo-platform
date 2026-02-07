'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, MessageSquare, HelpCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TroubleshootingItem {
  question: string;
  answer: string;
}

interface TroubleshootingTabProps {
  items: TroubleshootingItem[];
}

export function TroubleshootingTab({ items }: TroubleshootingTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Dépannage Complet</h3>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
              <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 whitespace-pre-line leading-relaxed pt-2 pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card className="p-8 md:p-10 bg-yellow-50 border-2 border-yellow-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-yellow-600" />
          Besoin d&apos;aide supplémentaire ?
        </h3>
        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
          Notre équipe support est disponible 7j/7 pour vous aider. Contactez-nous et nous répondrons sous 2h. Nous offrons également des sessions de dépannage en direct via écran partagé.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/contact">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacter le support
            </Button>
          </Link>
          <Link href="/help/support">
            <Button variant="outline" className="w-full">
              <HelpCircle className="w-4 h-4 mr-2" />
              Centre d&apos;aide
            </Button>
          </Link>
          <Link href="/help/documentation/troubleshooting/common-errors">
            <Button variant="outline" className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Guide dépannage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
