'use client';

import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { cn } from '@/lib/utils';

export interface ResetButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ResetButton({
  className,
  variant = 'ghost',
  size = 'default',
  showLabel = true,
}: ResetButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const resetAll = useConfigurator3DStore((s) => s.resetAll);

  const handleReset = () => {
    resetAll();
    setIsConfirmOpen(false);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsConfirmOpen(true)}
      >
        <RotateCcw className={cn('h-4 w-4', showLabel && 'mr-2')} />
        {showLabel && 'Reset'}
      </Button>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset configuration?</DialogTitle>
            <DialogDescription>
              This will reset all your selections to the default values. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
