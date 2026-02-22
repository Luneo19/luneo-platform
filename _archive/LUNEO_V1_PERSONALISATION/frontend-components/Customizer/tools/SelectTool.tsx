'use client';

import { MousePointer2 } from 'lucide-react';
import { useTool } from '@/hooks/customizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * SelectTool - Select mode indicator and instructions
 */
export function SelectTool() {
  const { activeTool } = useTool();
  const isActive = activeTool === 'select';

  if (!isActive) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MousePointer2 className="h-5 w-5" />
          <CardTitle>Select Tool</CardTitle>
        </div>
        <CardDescription>Click to select objects, drag to move</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Click on objects to select them</p>
          <p>• Drag selected objects to move</p>
          <p>• Use handles to resize</p>
          <p>• Press Delete to remove selected objects</p>
        </div>
      </CardContent>
    </Card>
  );
}
