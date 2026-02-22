'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { ShareModal } from '../modals/ShareModal';
import { cn } from '@/lib/utils';

export interface ShareButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function ShareButton({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ShareButtonProps) {
  const openModal = useConfigurator3DStore((s) => s.openModal);
  const activeModal = useConfigurator3DStore((s) => s.ui.activeModal);
  const closeModal = useConfigurator3DStore((s) => s.closeModal);

  const isOpen = activeModal === 'share';

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => openModal('share')}
      >
        <Share2 className={cn('h-4 w-4', showLabel && 'mr-2')} />
        {showLabel && 'Share'}
      </Button>
      <ShareModal
        open={isOpen}
        onOpenChange={(open) => !open && closeModal()}
      />
    </>
  );
}
