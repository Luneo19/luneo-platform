'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FAQTabProps {
  items: { question: string; answer: string }[];
}

export function FAQTab({ items }: FAQTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Questions Fréquentes Stripe</h3>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-gray-200">
              <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                <div className="flex items-center gap-3"><HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />{item.question}</div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}
