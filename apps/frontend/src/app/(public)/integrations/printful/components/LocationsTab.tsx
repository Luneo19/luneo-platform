'use client';

import React from 'react';
import { Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ProductionLocation {
  country: string;
  cities: string[];
  icon: React.ReactNode;
  shipping: string;
}

interface LocationsTabProps {
  productionLocations: ProductionLocation[];
}

export function LocationsTab({ productionLocations }: LocationsTabProps) {
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Centres de Production Printful</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {productionLocations.map((location, idx) => (
            <Card key={idx} className="p-6">
              <div className="flex items-start gap-4">
                {location.icon}
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{location.country}</h4>
                  <p className="text-gray-600 mb-3">Villes: {location.cities.join(', ')}</p>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Truck className="w-4 h-4" />
                    <span>Expédition: {location.shipping}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
