import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  DesignData, 
  Layer, 
  CanvasData, 
  HistoryState,
  ProductConfig,
  LayerType,
  TextLayerData,
  ImageLayerData,
  ShapeLayerData
} from '../types/designer.types';

interface DesignerState {
  // Design State
  design: DesignData | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  
  // Canvas State
  canvas: CanvasData;
  selectedLayerId: string | null;
  activeTool: 'select' | 'text' | 'image' | 'shape' | 'pan';
  
  // Product Config
  product: ProductConfig | null;
  
  // History
  history: HistoryState;
  
  // UI State
  showLayers: boolean;
  showProperties: boolean;
  zoom: number;
}

interface DesignerActions {
  // Design Actions
  initDesign: (productId: string, apiKey: string) => Promise<void>;
  loadDesign: (designId: string) => Promise<void>;
  saveDesign: () => Promise<string>;
  resetDesign: () => void;
  
  // Layer Actions
  addLayer: (type: LayerType, data?: Partial<Layer>) => string;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => string;
  selectLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  
  // Canvas Actions
  setZoom: (zoom: number) => void;
  pan: (deltaX: number, deltaY: number) => void;
  resetView: () => void;
  
  // Tool Actions
  setActiveTool: (tool: DesignerState['activeTool']) => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // UI Actions
  toggleLayers: () => void;
  toggleProperties: () => void;
  
  // Export Actions
  exportAsPNG: () => Promise<Blob>;
  exportAsPDF: () => Promise<Blob>;
  exportAsJSON: () => string;
}

type DesignerStore = DesignerState & DesignerActions;

const initialCanvasState: CanvasData = {
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  zoom: 1,
  panX: 0,
  panY: 0,
};

const initialHistoryState: HistoryState = {
  past: [],
  present: null as any,
  future: [],
  maxStates: 20,
};

export const useDesignerStore = create<DesignerStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial State
        design: null,
        isLoading: false,
        isSaving: false,
        isDirty: false,
        canvas: initialCanvasState,
        selectedLayerId: null,
        activeTool: 'select',
        product: null,
        history: initialHistoryState,
        showLayers: true,
        showProperties: true,
        zoom: 1,
        
        // Implementations...
        initDesign: async (productId, apiKey) => {
          set({ isLoading: true });
          try {
            // Fetch product config from API
            const response = await fetch(`/api/widget/products/${productId}`, {
              headers: { 'X-API-Key': apiKey },
            });
            const product = await response.json();
            
            const newDesign: DesignData = {
              productId,
              canvas: initialCanvasState,
              layers: [],
              metadata: {},
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            set({ 
              design: newDesign, 
              product: product.data,
              isLoading: false,
              history: { ...initialHistoryState, present: newDesign },
            });
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },
        
        addLayer: (type, data) => {
          const id = crypto.randomUUID();
          const state = get();
          
          const newLayer: Layer = {
            id,
            type,
            name: `${type} ${(state.design?.layers.length || 0) + 1}`,
            visible: true,
            locked: false,
            zIndex: state.design?.layers.length || 0,
            position: { x: 100, y: 100 },
            rotation: 0,
            scale: { x: 1, y: 1 },
            opacity: 1,
            data: getDefaultLayerData(type),
            ...data,
          };
          
          set((state) => {
            if (state.design) {
              state.design.layers.push(newLayer);
              state.design.updatedAt = new Date().toISOString();
              state.isDirty = true;
              state.selectedLayerId = id;
            }
          });
          
          get().pushHistory();
          return id;
        },
        
        updateLayer: (id, updates) => {
          set((state) => {
            if (state.design) {
              const index = state.design.layers.findIndex(l => l.id === id);
              if (index !== -1) {
                Object.assign(state.design.layers[index], updates);
                state.design.updatedAt = new Date().toISOString();
                state.isDirty = true;
              }
            }
          });
        },
        
        deleteLayer: (id) => {
          set((state) => {
            if (state.design) {
              state.design.layers = state.design.layers.filter(l => l.id !== id);
              if (state.selectedLayerId === id) {
                state.selectedLayerId = null;
              }
              state.isDirty = true;
            }
          });
          get().pushHistory();
        },
        
        duplicateLayer: (id) => {
          const state = get();
          const layer = state.design?.layers.find(l => l.id === id);
          if (!layer) return '';
          
          const newId = crypto.randomUUID();
          const newLayer: Layer = {
            ...JSON.parse(JSON.stringify(layer)),
            id: newId,
            name: `${layer.name} (copy)`,
            position: {
              x: layer.position.x + 20,
              y: layer.position.y + 20,
            },
          };
          
          set((state) => {
            if (state.design) {
              state.design.layers.push(newLayer);
              state.selectedLayerId = newId;
              state.isDirty = true;
            }
          });
          
          get().pushHistory();
          return newId;
        },
        
        selectLayer: (id) => {
          set({ selectedLayerId: id });
        },
        
        reorderLayers: (fromIndex, toIndex) => {
          set((state) => {
            if (state.design) {
              const [removed] = state.design.layers.splice(fromIndex, 1);
              state.design.layers.splice(toIndex, 0, removed);
              // Update zIndex
              state.design.layers.forEach((layer, index) => {
                layer.zIndex = index;
              });
              state.isDirty = true;
            }
          });
          get().pushHistory();
        },
        
        toggleLayerVisibility: (id) => {
          set((state) => {
            if (state.design) {
              const layer = state.design.layers.find(l => l.id === id);
              if (layer) {
                layer.visible = !layer.visible;
              }
            }
          });
        },
        
        toggleLayerLock: (id) => {
          set((state) => {
            if (state.design) {
              const layer = state.design.layers.find(l => l.id === id);
              if (layer) {
                layer.locked = !layer.locked;
              }
            }
          });
        },
        
        setZoom: (zoom) => {
          set((state) => {
            state.canvas.zoom = Math.max(0.1, Math.min(5, zoom));
            state.zoom = state.canvas.zoom;
          });
        },
        
        pan: (deltaX, deltaY) => {
          set((state) => {
            state.canvas.panX += deltaX;
            state.canvas.panY += deltaY;
          });
        },
        
        resetView: () => {
          set((state) => {
            state.canvas.zoom = 1;
            state.canvas.panX = 0;
            state.canvas.panY = 0;
            state.zoom = 1;
          });
        },
        
        setActiveTool: (tool) => {
          set({ activeTool: tool, selectedLayerId: null });
        },
        
        undo: () => {
          set((state) => {
            if (state.history.past.length > 0) {
              const previous = state.history.past[state.history.past.length - 1];
              const newPast = state.history.past.slice(0, -1);
              state.history = {
                ...state.history,
                past: newPast,
                present: previous,
                future: [state.history.present, ...state.history.future],
              };
              state.design = previous;
              state.isDirty = true;
            }
          });
        },
        
        redo: () => {
          set((state) => {
            if (state.history.future.length > 0) {
              const next = state.history.future[0];
              const newFuture = state.history.future.slice(1);
              state.history = {
                ...state.history,
                past: [...state.history.past, state.history.present],
                present: next,
                future: newFuture,
              };
              state.design = next;
              state.isDirty = true;
            }
          });
        },
        
        pushHistory: () => {
          set((state) => {
            if (state.design) {
              const newPast = [...state.history.past, state.history.present]
                .slice(-state.history.maxStates);
              state.history = {
                ...state.history,
                past: newPast,
                present: JSON.parse(JSON.stringify(state.design)),
                future: [],
              };
            }
          });
        },
        
        saveDesign: async () => {
          const state = get();
          if (!state.design) throw new Error('No design to save');
          
          set({ isSaving: true });
          try {
            const response = await fetch('/api/widget/designs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state.design),
            });
            const result = await response.json();
            set({ isSaving: false, isDirty: false });
            return result.data.designId;
          } catch (error) {
            set({ isSaving: false });
            throw error;
          }
        },
        
        loadDesign: async (designId: string) => {
          set({ isLoading: true });
          try {
            const response = await fetch(`/api/widget/designs/${designId}`);
            const result = await response.json();
            if (result.success && result.data) {
              set({
                design: result.data,
                isLoading: false,
                history: { ...initialHistoryState, present: result.data },
              });
            } else {
              throw new Error(result.error || 'Failed to load design');
            }
          } catch (error) {
            set({ isLoading: false });
            throw error;
          }
        },
        
        resetDesign: () => {
          set({
            design: null,
            selectedLayerId: null,
            history: initialHistoryState,
            isDirty: false,
          });
        },
        
        toggleLayers: () => set((state) => ({ showLayers: !state.showLayers })),
        toggleProperties: () => set((state) => ({ showProperties: !state.showProperties })),
        
        exportAsPNG: async () => {
          // Implementation will use canvas.toBlob()
          throw new Error('Not implemented');
        },
        
        exportAsPDF: async () => {
          // Implementation will use jsPDF
          throw new Error('Not implemented');
        },
        
        exportAsJSON: () => {
          const state = get();
          return JSON.stringify(state.design, null, 2);
        },
        
        // Computed properties
        get canUndo() {
          return get().history.past.length > 0;
        },
        
        get canRedo() {
          return get().history.future.length > 0;
        },
      }))
    ),
    { name: 'LuneoDesigner' }
  )
);

function getDefaultLayerData(type: LayerType): TextLayerData | ImageLayerData | ShapeLayerData {
  switch (type) {
    case 'text':
      return {
        content: 'New Text',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
      };
    case 'image':
      return {
        src: '',
        originalSrc: '',
        width: 200,
        height: 200,
      };
    case 'shape':
      return {
        shapeType: 'rectangle',
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        strokeWidth: 2,
        cornerRadius: 8,
      };
    default:
      // Fallback for clipart or unknown types
      return {
        content: '',
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: 0,
      };
  }
}

