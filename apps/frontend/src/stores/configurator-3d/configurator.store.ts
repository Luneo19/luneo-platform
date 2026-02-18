/**
 * 3D Configurator Zustand Store
 * Uses devtools, persist, subscribeWithSelector, immer middlewares
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type {
  Configurator3DConfig,
  Configurator3DEvent,
  Configurator3DEventCallback,
  Configurator3DOption,
  Configurator3DRule,
  HistoryEntry,
  PriceBreakdown,
  SelectionState,
  ValidationResult,
  BackendConfigurator3DConfig,
  DeviceInfo,
} from '@/lib/configurator-3d/types/configurator.types';

const API_PREFIX = '/api/v1/configurator-3d';
const MAX_HISTORY_SIZE = 50;

// -----------------------------------------------------------------------------
// State Types
// -----------------------------------------------------------------------------

interface UIState {
  selectedComponentId: string | null;
  hoveredOptionId: string | null;
  isFullscreen: boolean;
  isPanelCollapsed: boolean;
  activeModal: string | null;
  zoom: number;
}

interface SceneState {
  isSceneReady: boolean;
  isModelLoaded: boolean;
  loadingProgress: number;
  cameraPosition: { x: number; y: number; z: number } | null;
  cameraTarget: { x: number; y: number; z: number } | null;
}

interface ConfiguratorState {
  configuration: Configurator3DConfig | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  sessionId: string | null;
  selections: SelectionState;
  defaultSelections: SelectionState;
  price: number;
  priceBreakdown: PriceBreakdown | null;
  isPriceCalculating: boolean;
  validation: ValidationResult;
  history: HistoryEntry[];
  historyIndex: number;
  ui: UIState;
  scene: SceneState;
  eventListeners: Map<string, Set<Configurator3DEventCallback>>;
}

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

interface ConfiguratorActions {
  initialize: (configId: string, projectId?: string) => Promise<void>;
  reset: () => void;
  selectOption: (componentId: string, optionId: string) => void;
  deselectOption: (componentId: string, optionId?: string) => void;
  toggleOption: (componentId: string, optionId: string) => void;
  resetComponent: (componentId: string) => void;
  resetAll: () => void;
  applySelections: (selections: SelectionState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  calculatePrice: () => Promise<void>;
  validate: () => void;
  setSelectedComponent: (componentId: string | null) => void;
  setHoveredOption: (optionId: string | null) => void;
  toggleFullscreen: () => void;
  togglePanel: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setZoom: (zoom: number) => void;
  setSceneReady: (ready: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setCameraPosition: (pos: { x: number; y: number; z: number } | null) => void;
  setCameraTarget: (target: { x: number; y: number; z: number } | null) => void;
  focusOnComponent: (componentId: string) => void;
  addEventListener: (type: string, callback: Configurator3DEventCallback) => () => void;
  emit: (event: Configurator3DEvent) => void;
  startSession: (configId: string, deviceInfo?: DeviceInfo) => Promise<void>;
  updateSession: (selections?: SelectionState, previewImageUrl?: string) => Promise<void>;
  completeSession: () => Promise<void>;
  saveDesign: (name?: string, description?: string) => Promise<{ id: string } | null>;
  loadSavedDesign: (designId: string) => Promise<void>;
  captureScreenshot: () => Promise<string | null>;
  exportToPDF: (options?: Record<string, unknown>) => Promise<string | null>;
  exportToAR: (options?: Record<string, unknown>) => Promise<string | null>;
  addToCart: () => Promise<{ success: boolean; error?: string }>;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function mapBackendToConfig(backend: BackendConfigurator3DConfig): Configurator3DConfig {
  const sceneSettings = (backend.sceneConfig || {}) as Configurator3DConfig['sceneSettings'];
  const cameraSettings = (backend.cameraSettings || {}) as Configurator3DConfig['cameraSettings'];
  const pricingSettings = (backend.pricingSettings || {}) as Configurator3DConfig['pricingSettings'];
  const uiSettings = (backend.uiConfig || {}) as Configurator3DConfig['uiSettings'];

  const components = (backend.components || []).map((c) => ({
    id: c.id,
    name: c.name,
    technicalId: c.technicalId ?? undefined,
    description: c.description ?? undefined,
    type: c.type as Configurator3DConfig['components'][0]['type'],
    selectionMode: c.selectionMode,
    isRequired: c.isRequired,
    minSelections: c.minSelections,
    maxSelections: c.maxSelections,
    sortOrder: c.sortOrder,
    isVisible: c.isVisible,
    isEnabled: c.isEnabled,
    iconUrl: c.iconUrl ?? undefined,
    previewImageUrl: c.previewImageUrl ?? undefined,
    bounds: c.bounds as Configurator3DConfig['components'][0]['bounds'],
    cameraFocusPoint: c.cameraFocusPoint as Configurator3DConfig['components'][0]['cameraFocusPoint'],
    dependencies: c.dependencies ?? [],
    options: (c.options || []).map((o) => ({
      id: o.id,
      componentId: c.id,
      name: o.name,
      sku: o.sku ?? undefined,
      description: o.description ?? undefined,
      type: o.type,
      sortOrder: o.sortOrder,
      isDefault: o.isDefault,
      isEnabled: o.isEnabled,
      isVisible: o.isVisible,
      previewImageUrl: o.previewImageUrl ?? undefined,
      swatchImageUrl: o.swatchImageUrl ?? undefined,
      inStock: o.inStock,
      stockQuantity: o.stockQuantity ?? undefined,
      leadTimeDays: o.leadTimeDays ?? undefined,
      textureUrls: o.textureUrls as Configurator3DOption['textureUrls'],
      modelUrl: o.modelUrl ?? undefined,
      pricing: {
        priceDelta: o.priceDelta ?? 0,
        pricingType: o.pricingType ?? 'FIXED',
        priceModifier: o.priceModifier ?? 0,
        priceFormula: o.priceFormula ?? undefined,
        currency: o.currency ?? 'EUR',
      },
    })),
  }));

  const rules = (backend.rules || []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? undefined,
    type: r.type,
    conditions: (r.conditions as Configurator3DRule['conditions']) ?? [],
    actions: (r.actions as Configurator3DRule['actions']) ?? [],
    priority: r.priority,
    isEnabled: r.isEnabled,
  }));

  return {
    id: backend.id,
    name: backend.name,
    description: backend.description ?? undefined,
    productId: backend.productId ?? undefined,
    type: backend.type,
    status: backend.status,
    modelUrl: backend.modelUrl ?? undefined,
    modelFormat: backend.modelFormat ?? 'gltf',
    thumbnailUrl: backend.thumbnailUrl ?? undefined,
    sceneSettings,
    cameraSettings,
    pricingSettings,
    uiSettings,
    features: {
      enableAR: backend.enableAR,
      enableScreenshots: backend.enableScreenshots,
      enableSharing: backend.enableSharing,
      enablePricing: backend.enablePricing,
      enableComparison: backend.enableComparison,
    },
    components,
    rules,
  };
}

function getDefaultSelections(config: Configurator3DConfig): SelectionState {
  const defaults: SelectionState = {};
  for (const comp of config.components) {
    const defaultOpt = comp.options.find((o) => o.isDefault);
    if (defaultOpt) {
      if (comp.selectionMode === 'MULTIPLE' && comp.maxSelections > 1) {
        defaults[comp.id] = [defaultOpt.id];
      } else {
        defaults[comp.id] = defaultOpt.id;
      }
    }
  }
  return defaults;
}

function generateHistoryId(): string {
  return `hist_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

const initialState: ConfiguratorState = {
  configuration: null,
  isLoading: false,
  isInitialized: false,
  error: null,
  sessionId: null,
  selections: {},
  defaultSelections: {},
  price: 0,
  priceBreakdown: null,
  isPriceCalculating: false,
  validation: { valid: true, errors: [], warnings: [] },
  history: [],
  historyIndex: -1,
  ui: {
    selectedComponentId: null,
    hoveredOptionId: null,
    isFullscreen: false,
    isPanelCollapsed: false,
    activeModal: null,
    zoom: 1,
  },
  scene: {
    isSceneReady: false,
    isModelLoaded: false,
    loadingProgress: 0,
    cameraPosition: null,
    cameraTarget: null,
  },
  eventListeners: new Map(),
};

export const useConfigurator3DStore = create<ConfiguratorState & ConfiguratorActions>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          initialize: async (configId: string, projectId?: string) => {
            set((state) => {
              state.isLoading = true;
              state.error = null;
            });
            try {
              const params = projectId ? { projectId } : undefined;
              const url = projectId
                ? `${API_PREFIX}/configurations/${configId}`
                : `${API_PREFIX}/public/configurations/${configId}`;
              const backend = await api.get<BackendConfigurator3DConfig>(url, { params });
              const config = mapBackendToConfig(backend);
              const defaultSelections = getDefaultSelections(config);

              set((state) => {
                state.configuration = config;
                state.defaultSelections = defaultSelections;
                state.selections = { ...defaultSelections };
                state.isInitialized = true;
                state.isLoading = false;
              });

              await get().startSession(configId);
              await get().calculatePrice();
              get().validate();
              get().emit({
                type: 'configurator:loaded',
                configurationId: configId,
                timestamp: Date.now(),
              });
            } catch (err) {
              logger.error('Configurator 3D initialize failed', { error: err, configId });
              set((state) => {
                state.error = err instanceof Error ? err.message : 'Failed to load configuration';
                state.isLoading = false;
              });
            }
          },

          reset: () => {
            const { configuration, defaultSelections } = get();
            set((state) => {
              state.selections = configuration ? { ...defaultSelections } : {};
              state.history = [];
              state.historyIndex = -1;
              state.validation = { valid: true, errors: [], warnings: [] };
              state.ui = { ...initialState.ui };
            });
          },

          selectOption: (componentId: string, optionId: string) => {
            const { configuration, selections } = get();
            if (!configuration) return;

            const comp = configuration.components.find((c) => c.id === componentId);
            if (!comp) return;

            const prev = selections[componentId];
            let newValue: string | string[];

            if (comp.selectionMode === 'MULTIPLE' && comp.maxSelections > 1) {
              const arr = Array.isArray(prev) ? [...prev] : prev ? [prev] : [];
              const idx = arr.indexOf(optionId);
              if (idx >= 0) return;
              if (arr.length >= comp.maxSelections) arr.shift();
              arr.push(optionId);
              newValue = arr;
            } else {
              newValue = optionId;
            }

            set((state) => {
              state.selections[componentId] = newValue;
              const entry: HistoryEntry = {
                id: generateHistoryId(),
                action: 'SELECT_OPTION',
                componentId,
                optionId,
                previousValue: prev,
                newValue,
                timestamp: Date.now(),
              };
              state.history = state.history.slice(0, state.historyIndex + 1);
              if (state.history.length >= MAX_HISTORY_SIZE) state.history.shift();
              state.history.push(entry);
              state.historyIndex = state.history.length - 1;
            });

            get().emit({
              type: 'option:selected',
              componentId,
              optionId,
              timestamp: Date.now(),
            });
            get().calculatePrice();
            get().validate();
          },

          deselectOption: (componentId: string, optionId?: string) => {
            const { configuration, selections } = get();
            if (!configuration) return;

            const comp = configuration.components.find((c) => c.id === componentId);
            if (!comp) return;

            const prev = selections[componentId];
            let newValue: string | string[] | undefined;

            if (comp.selectionMode === 'MULTIPLE' && Array.isArray(prev)) {
              if (optionId) {
                newValue = prev.filter((id) => id !== optionId);
                if (newValue.length === 0) newValue = undefined;
              } else {
                newValue = undefined;
              }
            } else {
              newValue = undefined;
            }

            set((state) => {
              if (newValue !== undefined) state.selections[componentId] = newValue;
              else delete state.selections[componentId];
            });
            get().calculatePrice();
            get().validate();
          },

          toggleOption: (componentId: string, optionId: string) => {
            const { selections } = get();
            const current = selections[componentId];
            const isSelected = Array.isArray(current)
              ? current.includes(optionId)
              : current === optionId;
            if (isSelected) {
              get().deselectOption(componentId, optionId);
            } else {
              get().selectOption(componentId, optionId);
            }
          },

          resetComponent: (componentId: string) => {
            const { configuration, defaultSelections } = get();
            const def = defaultSelections[componentId];
            set((state) => {
              if (def !== undefined) state.selections[componentId] = def;
              else delete state.selections[componentId];
            });
            get().calculatePrice();
            get().validate();
          },

          resetAll: () => {
            get().reset();
            const { defaultSelections } = get();
            set((state) => {
              state.selections = { ...defaultSelections };
            });
            get().calculatePrice();
            get().validate();
          },

          applySelections: (selections: SelectionState) => {
            set((state) => {
              state.selections = { ...selections };
            });
            get().calculatePrice();
            get().validate();
          },

          undo: () => {
            const { history, historyIndex } = get();
            if (historyIndex < 0) return;
            const entry = history[historyIndex];
            if (entry?.previousValue !== undefined && entry.componentId) {
              set((state) => {
                state.selections[entry.componentId!] = entry.previousValue as string | string[];
                state.historyIndex = historyIndex - 1;
              });
              get().calculatePrice();
              get().validate();
            }
          },

          redo: () => {
            const { history, historyIndex } = get();
            if (historyIndex >= history.length - 1) return;
            const entry = history[historyIndex + 1];
            if (entry?.newValue !== undefined && entry.componentId) {
              set((state) => {
                state.selections[entry.componentId!] = entry.newValue as string | string[];
                state.historyIndex = historyIndex + 1;
              });
              get().calculatePrice();
              get().validate();
            }
          },

          canUndo: () => get().historyIndex >= 0,
          canRedo: () => get().historyIndex < get().history.length - 1,

          clearHistory: () =>
            set((state) => {
              state.history = [];
              state.historyIndex = -1;
            }),

          calculatePrice: async () => {
            const { configuration, sessionId, selections } = get();
            if (!configuration?.features?.enablePricing) return;

            set((state) => {
              state.isPriceCalculating = true;
            });

            try {
              const result = await api.post<PriceBreakdown>(
                `${API_PREFIX}/configurations/${configuration.id}/calculate-price`,
                { selections }
              );
              set((state) => {
                state.price = result.total ?? 0;
                state.priceBreakdown = result;
                state.isPriceCalculating = false;
              });
              get().emit({
                type: 'price:updated',
                price: result.total ?? 0,
                breakdown: result,
                timestamp: Date.now(),
              });
            } catch (err) {
              logger.error('Price calculation failed', { error: err });
              set((state) => {
                state.isPriceCalculating = false;
              });
            }
          },

          validate: () => {
            const { configuration, selections } = get();
            if (!configuration) return;

            const errors: ValidationResult['errors'] = [];
            const warnings: ValidationResult['warnings'] = [];

            for (const comp of configuration.components) {
              const sel = selections[comp.id];
              const count = Array.isArray(sel) ? sel.length : sel ? 1 : 0;

              if (comp.isRequired && count === 0) {
                errors.push({
                  code: 'REQUIRED',
                  message: `${comp.name} is required`,
                  componentId: comp.id,
                });
              }
              if (count < comp.minSelections) {
                errors.push({
                  code: 'MIN_SELECTIONS',
                  message: `Select at least ${comp.minSelections} for ${comp.name}`,
                  componentId: comp.id,
                });
              }
              if (count > comp.maxSelections) {
                errors.push({
                  code: 'MAX_SELECTIONS',
                  message: `Select at most ${comp.maxSelections} for ${comp.name}`,
                  componentId: comp.id,
                });
              }
            }

            set((state) => {
              state.validation = {
                valid: errors.length === 0,
                errors,
                warnings,
              };
            });
          },

          setSelectedComponent: (componentId) =>
            set((state) => {
              state.ui.selectedComponentId = componentId;
            }),

          setHoveredOption: (optionId) =>
            set((state) => {
              state.ui.hoveredOptionId = optionId;
            }),

          toggleFullscreen: () =>
            set((state) => {
              state.ui.isFullscreen = !state.ui.isFullscreen;
            }),

          togglePanel: () =>
            set((state) => {
              state.ui.isPanelCollapsed = !state.ui.isPanelCollapsed;
            }),

          openModal: (modalId) =>
            set((state) => {
              state.ui.activeModal = modalId;
            }),

          closeModal: () =>
            set((state) => {
              state.ui.activeModal = null;
            }),

          setZoom: (zoom) =>
            set((state) => {
              state.ui.zoom = zoom;
            }),

          setSceneReady: (ready) =>
            set((state) => {
              state.scene.isSceneReady = ready;
            }),

          setModelLoaded: (loaded) =>
            set((state) => {
              state.scene.isModelLoaded = loaded;
            }),

          setLoadingProgress: (progress) =>
            set((state) => {
              state.scene.loadingProgress = progress;
            }),

          setCameraPosition: (pos) =>
            set((state) => {
              state.scene.cameraPosition = pos;
            }),

          setCameraTarget: (target) =>
            set((state) => {
              state.scene.cameraTarget = target;
            }),

          focusOnComponent: (componentId: string) => {
            const { configuration } = get();
            const comp = configuration?.components.find((c) => c.id === componentId);
            if (comp?.cameraFocusPoint) {
              set((state) => {
                state.scene.cameraTarget = comp.cameraFocusPoint as { x: number; y: number; z: number };
              });
            }
          },

          addEventListener: (type: string, callback: Configurator3DEventCallback) => {
            const listeners = get().eventListeners;
            if (!listeners.has(type)) listeners.set(type, new Set());
            listeners.get(type)!.add(callback);
            return () => listeners.get(type)?.delete(callback);
          },

          emit: (event: Configurator3DEvent) => {
            const listeners = get().eventListeners;
            const typeListeners = listeners.get(event.type);
            const allListeners = listeners.get('*');
            typeListeners?.forEach((cb) => cb(event));
            allListeners?.forEach((cb) => cb(event));
          },

          startSession: async (configId: string, deviceInfo?: DeviceInfo) => {
            try {
              const res = await api.post<{ id: string; sessionId: string }>(
                `${API_PREFIX}/sessions`,
                { configurationId: configId, deviceInfo }
              );
              set((state) => {
                state.sessionId = res.sessionId ?? res.id;
              });
            } catch (err) {
              logger.error('Session start failed', { error: err });
            }
          },

          updateSession: async (selections?: SelectionState, previewImageUrl?: string) => {
            const { sessionId } = get();
            if (!sessionId) return;
            try {
              await api.put(`${API_PREFIX}/sessions/${sessionId}`, {
                selections: selections ?? get().selections,
                previewImageUrl,
              });
            } catch (err) {
              logger.error('Session update failed', { error: err });
            }
          },

          completeSession: async () => {
            const { sessionId } = get();
            if (!sessionId) return;
            try {
              await api.post(`${API_PREFIX}/sessions/${sessionId}/complete`);
              get().emit({
                type: 'session:completed',
                sessionId,
                timestamp: Date.now(),
              });
            } catch (err) {
              logger.error('Session complete failed', { error: err });
            }
          },

          saveDesign: async (name?: string, description?: string) => {
            const { sessionId } = get();
            if (!sessionId) return null;
            try {
              const res = await api.post<{ id: string }>(
                `${API_PREFIX}/sessions/${sessionId}/save`,
                { name, description }
              );
              get().emit({
                type: 'design:saved',
                designId: res.id,
                name,
                timestamp: Date.now(),
              });
              return res;
            } catch (err) {
              logger.error('Save design failed', { error: err });
              return null;
            }
          },

          loadSavedDesign: async (designId: string) => {
            // Backend may expose GET /saved-designs/:id - adapt as needed
            logger.warn('loadSavedDesign not implemented - endpoint may vary');
          },

          captureScreenshot: async () => {
            // Client-side capture - returns data URL; optionally POST to export/image
            return null;
          },

          exportToPDF: async () => {
            const { sessionId } = get();
            if (!sessionId) return null;
            try {
              const res = await api.post<{ jobId?: string }>(
                `${API_PREFIX}/sessions/${sessionId}/export/pdf`,
                {}
              );
              return res.jobId ?? null;
            } catch (err) {
              logger.error('Export PDF failed', { error: err });
              return null;
            }
          },

          exportToAR: async () => {
            const { sessionId } = get();
            if (!sessionId) return null;
            try {
              const res = await api.post<{ jobId?: string }>(
                `${API_PREFIX}/sessions/${sessionId}/export/ar`,
                {}
              );
              return res.jobId ?? null;
            } catch (err) {
              logger.error('Export AR failed', { error: err });
              return null;
            }
          },

          addToCart: async () => {
            const { sessionId, validation } = get();
            if (!validation.valid) {
              return { success: false, error: validation.errors[0]?.message };
            }
            if (!sessionId) return { success: false, error: 'No active session' };
            try {
              await api.post(`${API_PREFIX}/sessions/${sessionId}/add-to-cart`, {});
              get().emit({
                type: 'add_to_cart',
                sessionId,
                price: get().price,
                timestamp: Date.now(),
              });
              return { success: true };
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Add to cart failed';
              return { success: false, error: msg };
            }
          },
        }))
      ),
      {
        name: 'configurator-3d-store',
        partialize: (state) => ({
          selections: state.selections,
          sessionId: state.sessionId,
        }),
      }
    ),
    { name: 'Configurator3D' }
  )
);

// -----------------------------------------------------------------------------
// Selectors
// -----------------------------------------------------------------------------

export const useConfiguration = () =>
  useConfigurator3DStore((s) => s.configuration);

export const useSelections = () =>
  useConfigurator3DStore((s) => s.selections);

export const usePrice = () =>
  useConfigurator3DStore((s) => s.price);

export const usePriceBreakdown = () =>
  useConfigurator3DStore((s) => s.priceBreakdown);

export const useValidation = () =>
  useConfigurator3DStore((s) => s.validation);

export const useHistory = () =>
  useConfigurator3DStore((s) => ({
    history: s.history,
    historyIndex: s.historyIndex,
  }));

export const useUI = () =>
  useConfigurator3DStore((s) => s.ui);

export const useScene = () =>
  useConfigurator3DStore((s) => s.scene);
