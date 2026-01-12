/**
 * ★★★ AUTOMATION NODE ★★★
 * Composant pour un node dans le workflow automation
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, GitBranch, Tag, Bell, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutomationStep } from '@/hooks/admin/use-automations';

export interface AutomationNodeProps {
  step: AutomationStep;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const nodeIcons: Record<string, React.ReactNode> = {
  email: <Mail className="w-5 h-5" />,
  wait: <Clock className="w-5 h-5" />,
  condition: <GitBranch className="w-5 h-5" />,
  tag: <Tag className="w-5 h-5" />,
  notify: <Bell className="w-5 h-5" />,
};

const nodeColors: Record<string, string> = {
  email: 'bg-blue-500/20 border-blue-500 text-blue-400',
  wait: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  condition: 'bg-purple-500/20 border-purple-500 text-purple-400',
  tag: 'bg-green-500/20 border-green-500 text-green-400',
  notify: 'bg-orange-500/20 border-orange-500 text-orange-400',
};

export function AutomationNode({
  step,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  className,
}: AutomationNodeProps) {
  const icon = nodeIcons[step.type] || <Mail className="w-5 h-5" />;
  const colorClass = nodeColors[step.type] || nodeColors.email;

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all hover:scale-105',
        colorClass,
        isSelected && 'ring-2 ring-white ring-offset-2',
        className
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm capitalize">{step.type}</span>
              {step.delay && (
                <Badge variant="secondary" className="text-xs">
                  {step.delay}h
                </Badge>
              )}
            </div>
            {step.templateId && (
              <p className="text-xs text-zinc-400 truncate">Template: {step.templateId}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
