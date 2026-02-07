'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RESPONSE_TEMPLATES } from './constants';
import type { ResponseTemplate } from './types';

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: ResponseTemplate) => void;
}

export function TemplateDialog({ open, onOpenChange, onUseTemplate }: TemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Templates de réponses</DialogTitle>
          <DialogDescription className="text-gray-400">
            Sélectionnez un template à utiliser
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {RESPONSE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className="bg-gray-900/50 border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer"
                onClick={() => onUseTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <Badge variant="outline" className="text-xs border-gray-600">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-3">{template.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
