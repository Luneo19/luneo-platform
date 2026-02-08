'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ChevronDown } from 'lucide-react';
import type { FAQ } from './data';

interface FAQSectionProps {
  faqs: FAQ[];
  openFaqIndex: number | null;
  onToggleFAQ: (index: number) => void;
}

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-700/50 rounded-xl overflow-hidden bg-gray-800/30 backdrop-blur-sm">
      <button onClick={onToggle} className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors">
        <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.question}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-blue-400 flex-shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700/50 pt-4">{faq.answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection({ faqs, openFaqIndex, onToggleFAQ }: FAQSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-3xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Questions Fréquentes</h2>
        </motion>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
              <FAQItem faq={faq} isOpen={openFaqIndex === index} onToggle={() => onToggleFAQ(index)} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
