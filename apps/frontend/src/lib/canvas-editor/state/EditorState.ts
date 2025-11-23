import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import Konva from 'konva';
import { logger } from '@/lib/logger';

export interface EditorState {
  // Canvas state
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  panX: number;
  panY: number;
  
  // Selection state
  selectedElement: Konva.Node | null;
  selectedElementType: 'text' | 'image' | 'shape' | null;
  
  // History state
  history: string[];
  historyStep: number;
  maxHistorySteps: number;
  
  // Tool state
  activeTool: 'select' | 'text' | 'image' | 'shape' | 'clipart';
  
  // Design state
  designName: string;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // UI state
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showGuides: boolean;
  guides: Array<{ id: string; type: 'horizontal' | 'vertical'; position: number }>;
  
  // Layer state
  layers: Array<{
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
  }>;
  activeLayerId: string | null;
  
  // Actions
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setSelectedElement: (element: Konva.Node | null, type?: 'text' | 'image' | 'shape') => void;
  setActiveTool: (tool: 'select' | 'text' | 'image' | 'shape' | 'clipart') => void;
  
  // History actions
  saveState: (stage: Konva.Stage) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // Design actions
  setDesignName: (name: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  
  // UI actions
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  addGuide: (type: 'horizontal' | 'vertical', position: number) => void;
  removeGuide: (id: string) => void;
  clearGuides: () => void;
  
  // Layer actions
  addLayer: (name: string) => void;
  removeLayer: (id: string) => void;
  setLayerVisible: (id: string, visible: boolean) => void;
  setLayerLocked: (id: string, locked: boolean) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setActiveLayer: (id: string) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  
  // Utility actions
  reset: () => void;
  exportState: () => any;
  importState: (state: any) => void;
}

const initialState = {
  // Canvas state
  canvasWidth: 800,
  canvasHeight: 600,
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // Selection state
  selectedElement: null,
  selectedElementType: null,
  
  // History state
  history: [],
  historyStep: -1,
  maxHistorySteps: 50,
  
  // Tool state
  activeTool: 'select' as const,
  
  // Design state
  designName: 'Untitled Design',
  isDirty: false,
  isSaving: false,
  lastSaved: null,
  
  // UI state
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  showRulers: true,
  showGuides: true,
  guides: [],
  
  // Layer state
  layers: [
    {
      id: 'default',
      name: 'Layer 1',
      visible: true,
      locked: false,
      opacity: 1,
    }
  ],
  activeLayerId: 'default',
};

export const useEditorState = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Canvas actions
    setCanvasSize: (width: number, height: number) =>
      set({ canvasWidth: width, canvasHeight: height }),

    setZoom: (zoom: number) =>
      set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

    setPan: (x: number, y: number) =>
      set({ panX: x, panY: y }),

    setSelectedElement: (element: Konva.Node | null, type?: 'text' | 'image' | 'shape') =>
      set({ 
        selectedElement: element,
        selectedElementType: type || null
      }),

    setActiveTool: (tool: 'select' | 'text' | 'image' | 'shape' | 'clipart') =>
      set({ activeTool: tool }),

    // History actions
    saveState: (stage: Konva.Stage) => {
      const state = get();
      const stageData = stage.toJSON();
      
      // Remove current step and all steps after it
      const newHistory = state.history.slice(0, state.historyStep + 1);
      
      // Add new state
      newHistory.push(stageData);
      
      // Limit history size
      if (newHistory.length > state.maxHistorySteps) {
        newHistory.shift();
      } else {
        set({ historyStep: state.historyStep + 1 });
      }
      
      set({ 
        history: newHistory,
        isDirty: true
      });
    },

    undo: () => {
      const state = get();
      if (state.historyStep > 0) {
        const newStep = state.historyStep - 1;
        set({ historyStep: newStep });
        return state.history[newStep];
      }
      return null;
    },

    redo: () => {
      const state = get();
      if (state.historyStep < state.history.length - 1) {
        const newStep = state.historyStep + 1;
        set({ historyStep: newStep });
        return state.history[newStep];
      }
      return null;
    },

    canUndo: () => {
      const state = get();
      return state.historyStep > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyStep < state.history.length - 1;
    },

    clearHistory: () =>
      set({ history: [], historyStep: -1 }),

    // Design actions
    setDesignName: (name: string) =>
      set({ designName: name }),

    setDirty: (dirty: boolean) =>
      set({ isDirty: dirty }),

    setSaving: (saving: boolean) =>
      set({ isSaving: saving }),

    setLastSaved: (date: Date | null) =>
      set({ lastSaved: date }),

    // UI actions
    toggleGrid: () =>
      set((state) => ({ showGrid: !state.showGrid })),

    toggleSnapToGrid: () =>
      set((state) => ({ snapToGrid: !state.snapToGrid })),

    setGridSize: (size: number) =>
      set({ gridSize: Math.max(5, Math.min(100, size)) }),

    toggleRulers: () =>
      set((state) => ({ showRulers: !state.showRulers })),

    toggleGuides: () =>
      set((state) => ({ showGuides: !state.showGuides })),

    addGuide: (type: 'horizontal' | 'vertical', position: number) =>
      set((state) => ({
        guides: [
          ...state.guides,
          {
            id: `guide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            position,
          }
        ]
      })),

    removeGuide: (id: string) =>
      set((state) => ({
        guides: state.guides.filter(guide => guide.id !== id)
      })),

    clearGuides: () =>
      set({ guides: [] }),

    // Layer actions
    addLayer: (name: string) =>
      set((state) => {
        const newLayer = {
          id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          visible: true,
          locked: false,
          opacity: 1,
        };
        return {
          layers: [...state.layers, newLayer],
          activeLayerId: newLayer.id,
        };
      }),

    removeLayer: (id: string) =>
      set((state) => {
        if (state.layers.length <= 1) return state; // Don't remove last layer
        
        const newLayers = state.layers.filter(layer => layer.id !== id);
        const newActiveLayerId = state.activeLayerId === id 
          ? newLayers[0].id 
          : state.activeLayerId;
        
        return {
          layers: newLayers,
          activeLayerId: newActiveLayerId,
        };
      }),

    setLayerVisible: (id: string, visible: boolean) =>
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === id ? { ...layer, visible } : layer
        )
      })),

    setLayerLocked: (id: string, locked: boolean) =>
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === id ? { ...layer, locked } : layer
        )
      })),

    setLayerOpacity: (id: string, opacity: number) =>
      set((state) => ({
        layers: state.layers.map(layer =>
          layer.id === id ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) } : layer
        )
      })),

    setActiveLayer: (id: string) =>
      set({ activeLayerId: id }),

    moveLayer: (id: string, direction: 'up' | 'down') =>
      set((state) => {
        const layers = [...state.layers];
        const index = layers.findIndex(layer => layer.id === id);
        
        if (index === -1) return state;
        
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        
        if (newIndex < 0 || newIndex >= layers.length) return state;
        
        // Swap layers
        [layers[index], layers[newIndex]] = [layers[newIndex], layers[index]];
        
        return { layers };
      }),

    // Utility actions
    reset: () => set(initialState),

    exportState: () => {
      const state = get();
      return {
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        designName: state.designName,
        layers: state.layers,
        guides: state.guides,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        gridSize: state.gridSize,
        showRulers: state.showRulers,
        showGuides: state.showGuides,
      };
    },

    importState: (importedState: any) =>
      set((state) => ({
        ...state,
        canvasWidth: importedState.canvasWidth || state.canvasWidth,
        canvasHeight: importedState.canvasHeight || state.canvasHeight,
        designName: importedState.designName || state.designName,
        layers: importedState.layers || state.layers,
        guides: importedState.guides || state.guides,
        showGrid: importedState.showGrid !== undefined ? importedState.showGrid : state.showGrid,
        snapToGrid: importedState.snapToGrid !== undefined ? importedState.snapToGrid : state.snapToGrid,
        gridSize: importedState.gridSize || state.gridSize,
        showRulers: importedState.showRulers !== undefined ? importedState.showRulers : state.showRulers,
        showGuides: importedState.showGuides !== undefined ? importedState.showGuides : state.showGuides,
      })),
  }))
);

// Subscribe to state changes for debugging
if (process.env.NODE_ENV === 'development') {
  useEditorState.subscribe(
    (state) => state,
    (state) => {
      logger.debug('Editor State Updated', {
        activeTool: state.activeTool,
        selectedElement: state.selectedElement?.id,
        historyStep: state.historyStep,
        isDirty: state.isDirty,
        layers: state.layers.length,
      });
    }
  );
}

export default useEditorState;
