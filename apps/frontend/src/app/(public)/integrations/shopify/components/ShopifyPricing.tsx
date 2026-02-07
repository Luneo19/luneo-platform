'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

export function ShopifyPricing() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="p-6 md:p-8 bg-gray-800/50 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Statistiques de Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">+35%</div>
            <div className="text-sm text-gray-400">Conversion</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">-40%</div>
            <div className="text-sm text-gray-400">Retours</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">+28%</div>
            <div className="text-sm text-gray-400">Panier moyen</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">2min</div>
            <div className="text-sm text-gray-400">Installation</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
