'use client';

import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    question: 'Comment fonctionne la génération IA ?',
    answer: 'Notre moteur IA utilise des modèles de pointe pour générer des designs uniques en quelques secondes. Vous pouvez personnaliser les prompts, les styles, et les paramètres pour obtenir exactement ce que vous cherchez.',
  },
  {
    question: 'Puis-je exporter en qualité print-ready ?',
    answer: 'Oui ! Tous nos exports supportent les formats print-ready professionnels, incluant CMYK, PDF/X-4, et résolutions haute définition pour l\'impression.',
  },
  {
    question: 'Quelles intégrations sont disponibles ?',
    answer: 'Nous supportons Shopify, WooCommerce, Stripe, Zapier, Make, Printful et bien d\'autres. Notre API REST complète permet également des intégrations personnalisées.',
  },
  {
    question: 'Y a-t-il une période d\'essai ?',
    answer: 'Oui, nous offrons un essai gratuit de 14 jours avec accès complet à toutes les fonctionnalités. Aucune carte bancaire requise.',
  },
  {
    question: 'Puis-je annuler à tout moment ?',
    answer: 'Absolument. Vous pouvez annuler votre abonnement à tout moment depuis votre dashboard. Aucun engagement long terme.',
  },
  {
    question: 'Quel support est disponible ?',
    answer: 'Nous offrons un support par email pour tous les plans, et un support prioritaire 24/7 pour les plans Pro et Enterprise. Les plans Enterprise incluent également un gestionnaire de compte dédié.',
  },
];

/**
 * FAQ Section - Accordion with common questions
 */
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 sm:py-32 bg-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Tout ce que vous devez savoir sur Luneo
          </p>
        </FadeIn>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <StaggerChildren className="space-y-4">
            {faqs.map((faq, index) => (
              <StaggerItem key={index}>
                <motion.div
                  initial={false}
                  className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50 backdrop-blur-sm"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="font-semibold text-white text-sm sm:text-base pr-4">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence initial={false}>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </div>
    </section>
  );
}
