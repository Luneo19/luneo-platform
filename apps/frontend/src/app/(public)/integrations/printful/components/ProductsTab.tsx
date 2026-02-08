'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProductCategory {
  name: string;
  products: string[];
  icon: React.ReactNode;
  color: string;
}

interface ProductsTabProps {
  productCategories: ProductCategory[];
}

export function ProductsTab({ productCategories }: ProductsTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Catalogue Produits Printful</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {productCategories.map((category, idx) => (
            <Card key={idx} className="p-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-white mb-4`}>{category.icon}</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h4>
              <ul className="space-y-2">
                {category.products.map((product, pIdx) => (
                  <li key={pIdx} className="flex items-center gap-2 text-gray-600"><CheckCircle2 className="w-4 h-4 text-green-600" /><span>{product}</span></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
