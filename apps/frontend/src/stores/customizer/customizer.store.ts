/**
 * Customizer Main Config Store
 * Manages the customizer configuration, initialization, and state
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CustomizerZone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'image' | 'shape';
  constraints?: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  };
}

export interface CustomizerPreset {
  id: string;
  name: string;
  thumbnail?: string;
  data: Record<string, unknown>;
}

export interface ToolSettings {
  enabled: boolean;
  defaultOptions?: Record<string, unknown>;
}

export interface TextSettings {
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultColor: string;
  availableFonts: string[];
  maxLength?: number;
}

export interface ImageSettings {
  maxFileSize: number; // bytes
  allowedFormats: string[];
  maxDimensions?: { width: number; height: number };
  minDimensions?: { width: number; height: number };
}

export interface PricingSettings {
  enabled: boolean;
  basePrice: number;
  pricePerColor?: number;
  pricePerText?: number;
  pricePerImage?: number;
  currency: string;
}

export interface ModerationSettings {
  enabled: boolean;
  blockProfanity: boolean;
  requireApproval: boolean;
  autoModerate: boolean;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'auto';
  showTooltips: boolean;
  showGrid: boolean;
  showRulers: boolean;
  language: string;
}

export interface CustomizerConfig {
  id: string;
  name: string;
  brandId: string;
  canvasWidth: number;
  canvasHeight: number;
  zones: CustomizerZone[];
  presets: CustomizerPreset[];
  toolSettings: Record<string, ToolSettings>;
  textSettings: TextSettings;
  imageSettings: ImageSettings;
  pricingSettings: PricingSettings;
  moderationSettings: ModerationSettings;
  uiSettings: UISettings;
  // Optional nested config objects for engine initialization
  canvas?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    backgroundImage?: string;
  };
  history?: {
    maxSize?: number;
  };
  ui?: {
    showGrid?: boolean;
    showRulers?: boolean;
    showSafeZone?: boolean;
    gridSize?: number;
    safeZoneMargin?: number;
    snapToGrid?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

// -----------------------------------------------------------------------------
// State Interface
// -----------------------------------------------------------------------------

interface CustomizerState {
  config: CustomizerConfig | null;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  isInitialized: boolean;
}

interface CustomizerActions {
  initialize: (customizerId: string) => Promise<void>;
  reset: () => void;
  setError: (error: string | null) => void;
}

type CustomizerStore = CustomizerState & CustomizerActions;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const initialState: CustomizerState = {
  config: null,
  isLoading: false,
  error: null,
  sessionId: null,
  isInitialized: false,
};

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export const useCustomizerStore = create<CustomizerStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        initialize: async (customizerId: string) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // TODO: Replace with actual API endpoint when available
            // For now, using a placeholder endpoint structure
            const config = await api.get<CustomizerConfig>(
              `/api/v1/customizer/configurations/${customizerId}`
            );

            const sessionId = crypto.randomUUID();

            set((state) => {
              state.config = config;
              state.sessionId = sessionId;
              state.isInitialized = true;
              state.isLoading = false;
            });

            logger.info('Customizer initialized', { customizerId, sessionId });
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : 'Failed to initialize customizer';
            logger.error('Customizer initialization failed', {
              error: err,
              customizerId,
            });

            set((state) => {
              state.error = errorMessage;
              state.isLoading = false;
            });
          }
        },

        reset: () => {
          set((state) => {
            Object.assign(state, initialState);
          });
          logger.info('Customizer store reset');
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },
      }))
    ),
    { name: 'CustomizerStore' }
  )
);
