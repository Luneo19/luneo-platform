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
import { useI18n } from '@/i18n/useI18n';
import type { OrderFilters } from '../types';

interface OrdersFiltersProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

const ORDER_STATUS_KEYS = [
  { value: 'all', key: 'orders.statusAll' as const },
  { value: 'pending', key: 'orders.statusPending' as const },
  { value: 'processing', key: 'orders.statusProcessing' as const },
  { value: 'shipped', key: 'orders.statusShipped' as const },
  { value: 'delivered', key: 'orders.statusDelivered' as const },
  { value: 'cancelled', key: 'orders.statusCancelled' as const },
] as const;

export function OrdersFilters({
  filters,
  onFiltersChange,
}: OrdersFiltersProps) {
  const { t } = useI18n();
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
    <Card className="p-4 bg-white border-gray-200">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, search: e.target.value })
            }
            placeholder={t('orders.searchPlaceholder')}
            className="pl-10 bg-white border-gray-200 text-gray-900"
          />
        </div>
        <Select
          value={localFilters.status}
          onValueChange={(value) =>
            setLocalFilters({ ...localFilters, status: value })
          }
        >
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder={t('orders.status')} />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUS_KEYS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {t(status.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleApplyFilters}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          {t('orders.apply')}
        </Button>
      </div>
    </Card>
  );
}






