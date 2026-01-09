'use client';

/**
 * DateRangePicker Component
 * Modern date range picker with calendar UI using Popover
 */

import * as React from 'react';
import { Calendar, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sélectionner';
    return format(date, 'dd/MM/yyyy');
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFromChange(e.target.value);
    // Si to est avant from, ajuster to
    if (to && e.target.value && e.target.value > to) {
      onToChange(e.target.value);
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToChange(e.target.value);
  };

  const hasValue = from && to;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal border-gray-600 text-gray-300 hover:bg-gray-800',
            !hasValue && 'text-gray-500',
            className
          )}
        >
          <CalendarDays className="mr-2 h-4 w-4" />
          {hasValue ? (
            <span>
              {formatDate(fromDate)} - {formatDate(toDate)}
            </span>
          ) : (
            <span>Choisir une période</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 bg-gray-800 border-gray-700" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Période personnalisée</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from" className="text-gray-300">
                Du
              </Label>
              <Input
                id="date-from"
                type="date"
                value={from}
                onChange={handleFromChange}
                max={to || undefined}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date-to" className="text-gray-300">
                Au
              </Label>
              <Input
                id="date-to"
                type="date"
                value={to}
                onChange={handleToChange}
                min={from || undefined}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
          </div>

          {from && to && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">
                {Math.ceil(
                  (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
                )}{' '}
                jours
              </span>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Appliquer
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
