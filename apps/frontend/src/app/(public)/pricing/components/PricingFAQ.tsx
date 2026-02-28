'use client';

import React, { useState } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface PricingFAQProps {
  items: FAQItem[];
  title?: string;
}

export function PricingFAQ({
  items,
  title = 'Questions fréquemment posées',
}: PricingFAQProps) {
  return (
    <div className="space-y-4">
      {title && (
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white font-display">{title}</h2>
        </div>
      )}
      {items.map((faq, index) => (
        <FAQAccordionItem
          key={index}
          question={faq.question}
          answer={faq.answer}
        />
      ))}
    </div>
  );
}

function FAQAccordionItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/[0.06] py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-lg font-semibold text-white">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-white/90 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-white/90">{answer}</p>
          </motion>
        )}
      </AnimatePresence>
    </div>
  );
}
