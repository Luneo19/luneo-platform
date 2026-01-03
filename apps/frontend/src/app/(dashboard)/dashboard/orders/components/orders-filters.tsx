'use client';

/**
 * Filtres pour les commandes
 * Client Component minimal
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import type { OrderFilters } from '../types';

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

const ORDER_STATUSES = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'processing', label: 'En traitement' },
  { value: 'shipped', label: 'Expédiées' },
  { value: 'delivered', label: 'Livrées' },
  { value: 'cancelled', label: 'Annulées' },
] as const;

export function OrdersFilters({
  filters,
  onFiltersChange,
}: OrdersFiltersProps) {
  const router = useRouter();
  const [localFilters, setLocalFilters] = useState<OrderFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    const params = new URLSearchParams();
    if (localFilters.status && localFilters.status !== 'all') {
      params.set('status', localFilters.status);
    }
    if (localFilters.search) {
      params.set('search', localFilters.search);
    }
    if (localFilters.startDate) {
      params.set('startDate', localFilters.startDate);
    }
    if (localFilters.endDate) {
      params.set('endDate', localFilters.endDate);
    }
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, search: e.target.value })
            }
            placeholder="Rechercher par numéro, client, email..."
            className="pl-10 bg-gray-900 border-gray-600 text-white"
          />
        </div>
        <Select
          value={localFilters.status}
          onValueChange={(value) =>
            setLocalFilters({ ...localFilters, status: value })
          }
        >
          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-600 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleApplyFilters}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Appliquer
        </Button>
      </div>
    </Card>
  );
}

