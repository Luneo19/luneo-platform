'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { SaveDesignModal } from '../modals/SaveDesignModal';
import { cn } from '@/lib/utils';

export interface SaveDesignButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function SaveDesignButton({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: SaveDesignButtonProps) {
  const openModal = useConfigurator3DStore((s) => s.openModal);
  const activeModal = useConfigurator3DStore((s) => s.ui.activeModal);
  const closeModal = useConfigurator3DStore((s) => s.closeModal);

  const isOpen = activeModal === 'save-design';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => openModal('save-design')}
      >
        <Save className={cn('h-4 w-4', showLabel && 'mr-2')} />
        {showLabel && 'Save Design'}
      </Button>
      <SaveDesignModal
        open={isOpen}
        onOpenChange={(open) => !open && closeModal()}
      />
    </>
  );
}
