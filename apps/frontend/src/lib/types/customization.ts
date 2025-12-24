/**
 * ★★★ TYPES - PERSONNALISATION ★★★
 * Types TypeScript complets pour le système de personnalisation
 * - Types de base
 * - Types API
 * - Types UI
 * - Types utilitaires
 */

// ========================================
// ENUMS
// ========================================

export enum ZoneType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  PATTERN = 'PATTERN',
  COLOR = 'COLOR',
}

export enum CustomizationEffect {
  NORMAL = 'NORMAL',
  EMBOSSED = 'EMBOSSED',
  ENGRAVED = 'ENGRAVED',
  THREE_D = 'THREE_D',
}

export enum CustomizationStatus {
  PENDING = 'PENDING',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum CustomizationOrientation {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  CURVED = 'curved',
}

// ========================================
// TYPES DE BASE
// ========================================

export interface Zone {
  id: string;
  name: string;
  description?: string;
  type: ZoneType;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  uvMinU: number;
  uvMaxU: number;
  uvMinV: number;
  uvMaxV: number;
  maxChars?: number;
  allowedFonts?: string[];
  defaultFont?: string;
  defaultColor?: string;
  defaultSize?: number;
  allowedColors?: string[];
  allowedPatterns?: string[];
  isRequired: boolean;
  isActive: boolean;
  order: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  productId: string;
}

export interface Customization {
  id: string;
  name?: string;
  description?: string;
  prompt: string;
  promptHash?: string;
  zoneId: string;
  productId: string;
  font?: string;
  color?: string;
  size?: number;
  effect: CustomizationEffect;
  orientation?: CustomizationOrientation;
  options?: Record<string, any>;
  status: CustomizationStatus;
  jobId?: string;
  textureUrl?: string;
  modelUrl?: string;
  previewUrl?: string;
  highResUrl?: string;
  arModelUrl?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  costCents: number;
  processingTimeMs?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  userId?: string;
  brandId?: string;
  designId?: string;
  orderId?: string;
}

// ========================================
// TYPES API
// ========================================

export interface CreateZoneRequest {
  productId: string;
  name: string;
  description?: string;
  type: ZoneType;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  uvMinU: number;
  uvMaxU: number;
  uvMinV: number;
  uvMaxV: number;
  maxChars?: number;
  allowedFonts?: string[];
  defaultFont?: string;
  defaultColor?: string;
  defaultSize?: number;
  allowedColors?: string[];
  allowedPatterns?: string[];
  isRequired?: boolean;
  order?: number;
  metadata?: Record<string, any>;
}

export interface UpdateZoneRequest extends Partial<CreateZoneRequest> {
  id: string;
}

export interface GenerateCustomizationRequest {
  productId: string;
  zoneId: string;
  prompt: string;
  font?: string;
  color?: string;
  size?: number;
  effect?: CustomizationEffect;
  orientation?: CustomizationOrientation;
  options?: Record<string, any>;
}

export interface GenerateCustomizationResponse {
  id: string;
  status: CustomizationStatus;
  message?: string;
}

export interface CustomizationStatusResponse {
  id: string;
  status: CustomizationStatus;
  previewUrl?: string;
  modelUrl?: string;
  errorMessage?: string;
  completedAt?: Date;
}

// ========================================
// TYPES UI
// ========================================

export interface ZoneConfiguratorState {
  zones: Zone[];
  selectedZoneId: string | null;
  isSelectingPosition: boolean;
  hoveredZoneId: string | null;
  isSaving: boolean;
  viewMode: '3d' | 'uv';
}

export interface PromptInputState {
  prompt: string;
  isValid: boolean;
  charCount: number;
  remainingChars: number;
  isGenerating: boolean;
  generationStatus: CustomizationStatus;
  error: string | null;
}

export interface Preview3DState {
  modelUrl: string | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
  autoRotate: boolean;
  cameraPosition: [number, number, number];
}

// ========================================
// TYPES UTILITAIRES
// ========================================

export interface CustomizationOptions {
  font?: string;
  color?: string;
  size?: number;
  effect?: CustomizationEffect;
  orientation?: CustomizationOrientation;
}

export interface CustomizationValidation {
  isValid: boolean;
  errors: string[];
}

export interface CustomizationCost {
  baseCost: number;
  effectMultiplier: number;
  totalCost: number;
  currency: string;
}

export interface CustomizationCache {
  key: string;
  customizationId: string;
  previewUrl: string;
  modelUrl: string;
  expiresAt: Date;
}

// ========================================
// TYPES EVENTS
// ========================================

export interface CustomizationEvent {
  type: 'generation_start' | 'generation_complete' | 'generation_error' | 'preview_loaded';
  customizationId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ========================================
// EXPORT
// ========================================

export type {
  Zone,
  Customization,
  CreateZoneRequest,
  UpdateZoneRequest,
  GenerateCustomizationRequest,
  GenerateCustomizationResponse,
  CustomizationStatusResponse,
  ZoneConfiguratorState,
  PromptInputState,
  Preview3DState,
  CustomizationOptions,
  CustomizationValidation,
  CustomizationCost,
  CustomizationCache,
  CustomizationEvent,
};

