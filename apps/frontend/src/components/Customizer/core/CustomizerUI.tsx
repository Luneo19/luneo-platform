'use client';

import { CustomizerToolbar } from './CustomizerToolbar';
import { CustomizerCanvas } from './CustomizerCanvas';
import { useUIStore, useSelectionStore, useLayersStore } from '@/stores/customizer';
import { LayersPanel } from '../panels/LayersPanel';
import { PropertiesPanel } from '../panels/PropertiesPanel';
import { TextTool } from '../tools/TextTool';
import { ImageTool } from '../tools/ImageTool';
import { ShapeTool } from '../tools/ShapeTool';
import { DrawTool } from '../tools/DrawTool';
import { EraseTool } from '../tools/EraseTool';
import { useTool } from '@/hooks/customizer';
import { Sheet, SheetContent } from '@/components/ui/sheet';

/**
 * CustomizerUI - Main layout component
 * Three-column layout: left sidebar | canvas | right sidebar
 * Responsive: stacks on mobile
 */
export function CustomizerUI() {
  const { leftPanelOpen, activeLeftPanel, rightPanelOpen, activeRightPanel, isMobile } = useUIStore();
  const { activeTool } = useTool();
  const selectedIds = useSelectionStore((state) => state.selectedIds);
  const { getLayerById } = useLayersStore();
  const selectedObject = selectedIds.length > 0 ? getLayerById(selectedIds[0]) : null;

  // Render left panel content based on active tool or panel
  const renderLeftPanel = () => {
    if (isMobile) {
      return null; // Mobile uses bottom sheet
    }

    if (!leftPanelOpen || !activeLeftPanel) {
      return null;
    }

    switch (activeLeftPanel) {
      case 'layers':
        return <LayersPanel />;
      case 'text':
        return <TextTool />;
      case 'images':
        return <ImageTool />;
      case 'shapes':
        return <ShapeTool />;
      default:
        return <LayersPanel />;
    }
  };

  // Render tool panel based on active tool
  const renderToolPanel = () => {
    switch (activeTool) {
      case 'text':
        return <TextTool />;
      case 'image':
        return <ImageTool />;
      case 'shape':
        return <ShapeTool />;
      case 'draw':
        return <DrawTool />;
      case 'eraser':
        return <EraseTool />;
      default:
        return null;
    }
  };

  // Mobile bottom sheet for tools
  const renderMobileToolSheet = () => {
    if (!isMobile) return null;

    const toolPanel = renderToolPanel();
    if (!toolPanel) return null;

    return (
      <Sheet open={true} modal={false}>
        <SheetContent side="bottom" className="h-[300px]">
          {toolPanel}
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Top Toolbar */}
      <CustomizerToolbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {!isMobile && (
          <div
            className={`border-r bg-background transition-all duration-200 ${
              leftPanelOpen && activeLeftPanel ? 'w-80' : 'w-0'
            } overflow-hidden`}
          >
            {renderLeftPanel()}
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <CustomizerCanvas />
        </div>

        {/* Right Sidebar - Properties */}
        {!isMobile && (
          <div
            className={`border-l bg-background transition-all duration-200 ${
              rightPanelOpen && selectedObject ? 'w-80' : 'w-0'
            } overflow-hidden`}
          >
            {rightPanelOpen && selectedObject && <PropertiesPanel />}
          </div>
        )}
      </div>

      {/* Mobile Tool Sheet */}
      {renderMobileToolSheet()}
    </div>
  );
}
