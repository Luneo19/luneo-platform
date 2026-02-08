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
import { DateRangePicker } from '@/components/ui/date-range-picker';
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
    <Card className="p-4 bg-white border-gray-200">
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
                  : 'border-gray-200 text-gray-700'
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
                  : 'border-gray-200 text-gray-700'
              )}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Personnalisé
          </Button>
        </div>

        {timeRange === 'custom' && (
          <DateRangePicker
            from={customDateFrom}
            to={customDateTo}
            onFromChange={onCustomDateFromChange}
            onToChange={onCustomDateToChange}
          />
        )}

        <div className="flex items-center gap-2 ml-auto">
          <Checkbox
            id="compare"
            checked={comparePeriod}
            onCheckedChange={(checked) => onCompareChange(checked as boolean)}
          />
          <Label htmlFor="compare" className="text-gray-700 cursor-pointer">
            Comparer avec période précédente
          </Label>
        </div>
      </div>
    </Card>
  );
}



