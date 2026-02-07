'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { FAQ_ITEMS } from '../data';

export function AssetHubFAQ() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Questions Fréquentes
          </h2>
        </motion.div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq) => (
            <Card key={faq.question} className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
              <p className="text-gray-400">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
