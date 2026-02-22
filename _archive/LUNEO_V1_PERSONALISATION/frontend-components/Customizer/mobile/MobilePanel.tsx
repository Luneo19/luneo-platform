'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MobilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function MobilePanel({
  isOpen,
  onClose,
  title,
  description,
  children,
}: MobilePanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <div className="flex flex-col h-full">
          {/* Handle */}
          <div className="flex-shrink-0 pt-3 pb-2">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto" />
          </div>

          {/* Header */}
          <SheetHeader className="px-4 pb-2 flex-shrink-0">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          {/* Content - Scrollable */}
          <ScrollArea className="flex-1 px-4">
            <div className="pb-4">{children}</div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
