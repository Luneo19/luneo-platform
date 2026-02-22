'use client';

import { useState } from 'react';
import { MobileToolbar } from './MobileToolbar';
import { MobilePanel } from './MobilePanel';
import { TouchGestures } from './TouchGestures';
import type { ToolType } from '@/stores/customizer';
import { useToolsStore } from '@/stores/customizer';
import { useCustomizerStore } from '@/stores/customizer';

interface MobileCustomizerProps {
  customizerId: string;
  children?: React.ReactNode; // Canvas component
}

export function MobileCustomizer({ customizerId, children }: MobileCustomizerProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const activeTool = useToolsStore((state) => state.activeTool);
  const config = useCustomizerStore((state) => state.config);

  const handleToolSelect = (tool: ToolType) => {
    useToolsStore.getState().setActiveTool(tool);
    // Open panel for tool-specific settings
    if (tool !== 'select') {
      setActivePanel(tool);
    } else {
      setActivePanel(null);
    }
  };

  const handleClosePanel = () => {
    setActivePanel(null);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Canvas Area - Full Screen */}
      <div className="flex-1 relative overflow-hidden">
        <TouchGestures>
          <div className="w-full h-full">{children}</div>
        </TouchGestures>
      </div>

      {/* Bottom Toolbar */}
      <MobileToolbar
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onUndo={() => {
          // Handle undo
        }}
        onRedo={() => {
          // Handle redo
        }}
        onSave={() => {
          // Handle save
        }}
        onExport={() => {
          // Handle export
        }}
      />

      {/* Bottom Sheet Panel */}
      {activePanel && (
        <MobilePanel
          isOpen={!!activePanel}
          onClose={handleClosePanel}
          title={activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
        >
          {/* Tool-specific content would go here */}
          <div className="p-4">
            <p className="text-muted-foreground">
              {activePanel} tool settings
            </p>
          </div>
        </MobilePanel>
      )}
    </div>
  );
}
