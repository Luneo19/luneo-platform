'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
}

/**
 * ToolButton - Reusable tool button with icon, label, and shortcut
 */
export function ToolButton({
  icon: Icon,
  label,
  isActive = false,
  onClick,
  shortcut,
  disabled = false,
}: ToolButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(isActive && 'bg-primary text-primary-foreground')}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div>
            <div>{label}</div>
            {shortcut && <div className="text-xs text-muted-foreground">{shortcut}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
