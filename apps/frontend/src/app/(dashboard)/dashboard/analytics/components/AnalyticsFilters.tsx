/**
 * Filtres temporels pour Analytics
 */

'use client';

import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TIME_RANGES } from '../constants/analytics';
import type { TimeRange } from '../types';

interface AnalyticsFiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  comparePeriod: boolean;
  onCompareChange: (compare: boolean) => void;
  customDateFrom: string;
  customDateTo: string;
  onCustomDateFromChange: (date: string) => void;
  onCustomDateToChange: (date: string) => void;
}

export function AnalyticsFilters({
  timeRange,
  onTimeRangeChange,
  comparePeriod,
  onCompareChange,
  customDateFrom,
  customDateTo,
  onCustomDateFromChange,
  onCustomDateToChange,
}: AnalyticsFiltersProps) {
  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {TIME_RANGES.filter((tr) => tr.value !== 'custom').map((range) => (
            <Button
              key={range.value}
              variant={timeRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onTimeRangeChange(range.value)}
              className={cn(
                timeRange === range.value
                  ? 'bg-cyan-600 text-white'
                  : 'border-gray-600 text-gray-300'
              )}
            >
              {range.label}
            </Button>
          ))}
          <Button
            variant={timeRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimeRangeChange('custom')}
            className={cn(
              timeRange === 'custom'
                ? 'bg-cyan-600 text-white'
                : 'border-gray-600 text-gray-300'
            )}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Personnalisé
          </Button>
        </div>

        {timeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customDateFrom}
              onChange={(e) => onCustomDateFromChange(e.target.value)}
              className="bg-gray-900 border-gray-600 text-white"
            />
            <span className="text-gray-400">→</span>
            <Input
              type="date"
              value={customDateTo}
              onChange={(e) => onCustomDateToChange(e.target.value)}
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Checkbox
            id="compare"
            checked={comparePeriod}
            onCheckedChange={(checked) => onCompareChange(checked as boolean)}
          />
          <Label htmlFor="compare" className="text-gray-300 cursor-pointer">
            Comparer avec période précédente
          </Label>
        </div>
      </div>
    </Card>
  );
}



