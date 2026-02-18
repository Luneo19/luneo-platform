'use client';

import { History, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHistory } from '@/hooks/customizer/useHistory';
import { useHistoryStore } from '@/stores/customizer';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

/**
 * HistoryPanel - History timeline panel
 */
export function HistoryPanel() {
  const { undo, redo, canUndo, canRedo, clearHistory, undoStackLength, redoStackLength } = useHistory();
  const undoStack = useHistoryStore((state) => state.undoStack);
  const redoStack = useHistoryStore((state) => state.redoStack);

  const allHistory = [...undoStack].reverse();

  const handleRestore = (index: number) => {
    // Calculate how many undo operations needed
    // The most recent entry is at the end of undoStack
    const targetIndex = undoStack.length - index - 1;
    const currentPosition = undoStack.length - 1; // Current position is the last item
    
    if (targetIndex < currentPosition) {
      // Need to undo to reach target
      const steps = currentPosition - targetIndex;
      for (let i = 0; i < steps; i++) {
        undo();
      }
    } else if (targetIndex > currentPosition && redoStack.length > 0) {
      // Need to redo to reach target
      const steps = targetIndex - currentPosition;
      for (let i = 0; i < steps && i < redoStack.length; i++) {
        redo();
      }
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>History</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={undoStack.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <CardDescription>Undo/redo timeline</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          {allHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <History className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No history yet. Start editing to see history.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allHistory.map((entry, index) => {
                // Current state is the last item in undoStack (index 0 in reversed array)
                const isCurrent = index === 0;
                return (
                  <button
                    key={index}
                    onClick={() => handleRestore(index)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2 rounded border text-left transition-colors',
                      isCurrent
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      isCurrent ? 'bg-primary' : 'bg-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {entry.label || `Action ${index + 1}`}
                      </div>
                      {entry.timestamp && (
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                    {isCurrent && (
                      <RotateCcw className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="mt-4 pt-4 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={undo}
            disabled={!canUndo}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Undo ({undoStackLength})
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={redo}
            disabled={!canRedo}
          >
            <RotateCcw className="h-4 w-4 mr-2 rotate-180" />
            Redo ({redoStackLength})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
