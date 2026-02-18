/**
 * 3D Configurator - Complete TypeScript Types
 * Matches Prisma schema and backend API contracts
 */

// =============================================================================
// ENUMS (string unions matching Prisma)
// =============================================================================

export type ConfiguratorType =
  | 'JEWELRY'
  | 'WATCH'
  | 'EYEWEAR'
  | 'FURNITURE'
  | 'APPAREL'
  | 'ACCESSORIES'
  | 'CUSTOM';

export type ConfiguratorStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type ComponentType =
  | 'MESH'
  | 'MATERIAL'
  | 'TEXTURE'
  | 'COLOR'
  | 'DECAL'
  | 'ACCESSORY'
  | 'SIZE'
  | 'ENGRAVING';

export type SelectionMode = 'SINGLE' | 'MULTIPLE' | 'REQUIRED' | 'OPTIONAL';

export type OptionType =
  | 'COLOR'
  | 'TEXTURE'
  | 'MATERIAL'
  | 'SIZE'
  | 'TEXT'
  | 'IMAGE'
  | 'MODEL'
  | 'NUMBER'
  | 'BOOLEAN';

export type PricingType = 'FIXED' | 'PERCENTAGE' | 'REPLACEMENT' | 'FORMULA';

export type RuleType =
  | 'DEPENDENCY'
  | 'EXCLUSION'
  | 'COMBINATION'
  | 'VISIBILITY'
  | 'PRICING'
  | 'VALIDATION';

export type SessionStatus =
  | 'ACTIVE'
  | 'SAVED'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'CONVERTED'
  | 'EXPIRED';

export type ConversionType =
  | 'ADD_TO_CART'
  | 'PURCHASE'
  | 'QUOTE_REQUEST'
  | 'SAVE_DESIGN'
  | 'SHARE';

// =============================================================================
// VECTOR & GEOMETRY
// =============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center?: Vector3;
  size?: Vector3;
}

// =============================================================================
// LIGHT & SCENE SETTINGS
// =============================================================================

export interface LightSettings {
  color?: string;
  intensity?: number;
  castShadow?: boolean;
}

export interface DirectionalLightSettings extends LightSettings {
  position?: Vector3;
  target?: Vector3;
  shadowMapSize?: number;
  shadowBias?: number;
}

export interface SpotLightSettings extends LightSettings {
  position?: Vector3;
  target?: Vector3;
  angle?: number;
  penumbra?: number;
  decay?: number;
}

export interface ShadowSettings {
  enabled: boolean;
  mapSize?: number;
  bias?: number;
  radius?: number;
}

export interface BloomSettings {
  enabled: boolean;
  intensity?: number;
  threshold?: number;
  radius?: number;
}

export interface SSAOSettings {
  enabled: boolean;
  radius?: number;
  intensity?: number;
  bias?: number;
}

export interface ToneMappingSettings {
  enabled: boolean;
  exposure?: number;
  type?: 'linear' | 'reinhard' | 'cineon' | 'aces';
}

export interface PostProcessingSettings {
  bloom?: BloomSettings;
  ssao?: SSAOSettings;
  toneMapping?: ToneMappingSettings;
}

export interface FloorSettings {
  enabled: boolean;
  color?: string;
  opacity?: number;
  receiveShadow?: boolean;
  size?: number;
}

export interface GridSettings {
  enabled: boolean;
  color?: string;
  divisions?: number;
  size?: number;
}

export interface SceneSettings {
  backgroundColor?: string;
  useEnvironmentMap?: boolean;
  environmentMapUrl?: string;
  ambientLight?: {
    color?: string;
    intensity?: number;
  };
  directionalLights?: DirectionalLightSettings[];
  spotLights?: SpotLightSettings[];
  shadows?: ShadowSettings;
  postProcessing?: PostProcessingSettings;
  floor?: FloorSettings;
  grid?: GridSettings;
}

// =============================================================================
// CAMERA SETTINGS
// =============================================================================

export interface CameraSettings {
  type?: 'perspective' | 'orthographic';
  fov?: number;
  near?: number;
  far?: number;
  initialPosition?: Vector3;
  initialTarget?: Vector3;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  minAzimuthAngle?: number;
  maxAzimuthAngle?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  dampingFactor?: number;
  animation?: {
    enabled?: boolean;
    duration?: number;
    easing?: string;
  };
}

// =============================================================================
// PRICING SETTINGS
// =============================================================================

export interface PricingSettings {
  enabled?: boolean;
  basePrice?: number;
  currency?: string;
  taxRate?: number;
  showTax?: boolean;
  showBasePrice?: boolean;
  dynamicPricing?: boolean;
  roundTo?: number;
}

// =============================================================================
// UI SETTINGS
// =============================================================================

export interface CustomTheme {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
}

export interface UISettings {
  theme?: 'light' | 'dark' | 'system';
  customTheme?: CustomTheme;
  layout?: 'sidebar' | 'bottom' | 'floating';
  compactMode?: boolean;
  showPrice?: boolean;
  showComponents?: boolean;
  showReset?: boolean;
  showShare?: boolean;
  showSave?: boolean;
  showAR?: boolean;
  showScreenshot?: boolean;
  labels?: Record<string, string>;
}

// =============================================================================
// FEATURES
// =============================================================================

export interface ConfiguratorFeatures {
  enableAR?: boolean;
  enableScreenshots?: boolean;
  enableSharing?: boolean;
  enablePricing?: boolean;
  enableComparison?: boolean;
}

// =============================================================================
// OPTION VALUE (discriminated union)
// =============================================================================

export interface ColorValue {
  type: 'COLOR';
  hex: string;
  rgb?: { r: number; g: number; b: number };
}

export interface MaterialValue {
  type: 'MATERIAL';
  materialId: string;
  roughness?: number;
  metalness?: number;
}

export interface TextureValue {
  type: 'TEXTURE';
  url: string;
  uvScale?: [number, number];
}

export interface TextureSet {
  map?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
}

export interface ModelValue {
  type: 'MODEL';
  url: string;
  scale?: number;
}

export interface SizeValue {
  type: 'SIZE';
  value: string | number;
  unit?: string;
}

export interface TextValue {
  type: 'TEXT';
  text: string;
  maxLength?: number;
}

export interface NumberValue {
  type: 'NUMBER';
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanValue {
  type: 'BOOLEAN';
  value: boolean;
}

export type OptionValue =
  | ColorValue
  | MaterialValue
  | TextureValue
  | ModelValue
  | SizeValue
  | TextValue
  | NumberValue
  | BooleanValue;

// =============================================================================
// OPTION PRICING
// =============================================================================

export interface OptionPricing {
  priceDelta?: number;
  pricingType?: PricingType;
  priceModifier?: number;
  priceFormula?: string;
  currency?: string;
}

// =============================================================================
// COMPONENT & OPTION
// =============================================================================

export interface Configurator3DOption {
  id: string;
  componentId: string;
  name: string;
  sku?: string;
  description?: string;
  type: OptionType;
  value?: OptionValue;
  pricing?: OptionPricing;
  sortOrder: number;
  isDefault: boolean;
  isEnabled: boolean;
  isVisible: boolean;
  previewImageUrl?: string;
  swatchImageUrl?: string;
  inStock?: boolean;
  stockQuantity?: number;
  leadTimeDays?: number;
  textureUrls?: Record<string, string> | string[];
  modelUrl?: string;
}

export interface Configurator3DComponent {
  id: string;
  name: string;
  technicalId?: string;
  description?: string;
  type: ComponentType;
  selectionMode: SelectionMode;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isVisible: boolean;
  isEnabled: boolean;
  iconUrl?: string;
  previewImageUrl?: string;
  bounds?: BoundingBox;
  cameraFocusPoint?: Vector3;
  dependencies?: string[];
  options: Configurator3DOption[];
}

// =============================================================================
// RULES
// =============================================================================

export type RuleOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface RuleCondition {
  componentId?: string;
  optionId?: string;
  field?: string;
  operator: RuleOperator;
  value: unknown;
}

export type RuleActionType =
  | 'SHOW_COMPONENT'
  | 'HIDE_COMPONENT'
  | 'ENABLE_OPTION'
  | 'DISABLE_OPTION'
  | 'SET_DEFAULT'
  | 'SET_PRICE'
  | 'VALIDATE';

export interface RuleAction {
  type: RuleActionType;
  componentId?: string;
  optionId?: string;
  priceModifier?: number;
  value?: unknown;
}

export interface Configurator3DRule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isEnabled: boolean;
}

// =============================================================================
// MAIN CONFIGURATION
// =============================================================================

export interface Configurator3DConfig {
  id: string;
  name: string;
  description?: string;
  productId?: string;
  type: ConfiguratorType;
  status: ConfiguratorStatus;
  modelUrl?: string;
  modelFormat?: string;
  thumbnailUrl?: string;
  sceneSettings?: SceneSettings;
  cameraSettings?: CameraSettings;
  pricingSettings?: PricingSettings;
  uiSettings?: UISettings;
  features?: ConfiguratorFeatures;
  components: Configurator3DComponent[];
  rules: Configurator3DRule[];
  metadata?: Record<string, unknown>;
}

// =============================================================================
// SESSION & SELECTION
// =============================================================================

export type SelectionState = Record<string, string | string[]>;

export interface Configurator3DSession {
  id: string;
  sessionId?: string;
  configurationId: string;
  status: SessionStatus;
  selections?: SelectionState;
  calculatedPrice?: number;
  priceBreakdown?: unknown;
  currency?: string;
  startedAt?: string;
  lastActivityAt?: string;
}

// =============================================================================
// PRICE BREAKDOWN
// =============================================================================

export interface PriceBreakdownItem {
  componentId: string;
  optionId: string;
  optionName: string;
  pricingType: PricingType;
  priceDelta: number;
  calculatedPrice: number;
  currency: string;
}

export interface PriceBreakdown {
  basePrice: number;
  optionsTotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  currency: string;
  breakdown: PriceBreakdownItem[];
  ruleAdjustments?: number;
}

// =============================================================================
// DEVICE & HISTORY
// =============================================================================

export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
  webglRenderer?: string;
  touchSupport?: boolean;
}

export type HistoryAction =
  | 'SELECT_OPTION'
  | 'DESELECT_OPTION'
  | 'RESET_COMPONENT'
  | 'RESET_ALL'
  | 'LOAD_DESIGN';

export interface HistoryEntry {
  id: string;
  action: HistoryAction;
  componentId?: string;
  optionId?: string;
  previousValue?: string | string[];
  newValue?: string | string[];
  timestamp: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationError {
  code: string;
  message: string;
  componentId?: string;
  optionId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  componentId?: string;
  optionId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// =============================================================================
// EVENTS
// =============================================================================

export interface ConfiguratorLoadedEvent {
  type: 'configurator:loaded';
  configurationId: string;
  timestamp: number;
}

export interface ComponentSelectedEvent {
  type: 'component:selected';
  componentId: string;
  timestamp: number;
}

export interface OptionSelectedEvent {
  type: 'option:selected';
  componentId: string;
  optionId: string;
  timestamp: number;
}

export interface OptionChangedEvent {
  type: 'option:changed';
  componentId: string;
  previousOptionId?: string;
  optionId: string;
  timestamp: number;
}

export interface PriceUpdatedEvent {
  type: 'price:updated';
  price: number;
  breakdown?: PriceBreakdown;
  timestamp: number;
}

export interface ScreenshotCapturedEvent {
  type: 'screenshot:captured';
  imageUrl: string;
  timestamp: number;
}

export interface ARLaunchedEvent {
  type: 'ar:launched';
  modelUrl: string;
  timestamp: number;
}

export interface DesignSavedEvent {
  type: 'design:saved';
  designId: string;
  name?: string;
  timestamp: number;
}

export interface DesignSharedEvent {
  type: 'design:shared';
  shareUrl: string;
  method?: string;
  timestamp: number;
}

export interface AddToCartEvent {
  type: 'add_to_cart';
  sessionId: string;
  price?: number;
  timestamp: number;
}

export interface SessionCompletedEvent {
  type: 'session:completed';
  sessionId: string;
  conversionType?: ConversionType;
  timestamp: number;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
  timestamp: number;
}

export type Configurator3DEvent =
  | ConfiguratorLoadedEvent
  | ComponentSelectedEvent
  | OptionSelectedEvent
  | OptionChangedEvent
  | PriceUpdatedEvent
  | ScreenshotCapturedEvent
  | ARLaunchedEvent
  | DesignSavedEvent
  | DesignSharedEvent
  | AddToCartEvent
  | SessionCompletedEvent
  | ErrorEvent;

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

export interface CalculatePriceRequest {
  selections: SelectionState;
}

export interface StartSessionRequest {
  configurationId: string;
  visitorId?: string;
  anonymousId?: string;
  deviceInfo?: DeviceInfo;
}

export interface StartSessionResponse {
  id: string;
  sessionId: string;
  configurationId: string;
  status: SessionStatus;
}

export interface UpdateSessionRequest {
  selections?: SelectionState;
  previewImageUrl?: string;
}

export interface SaveDesignRequest {
  name?: string;
  description?: string;
}

export interface SaveDesignResponse {
  id: string;
  name?: string;
  savedAt: string;
}

// =============================================================================
// BACKEND API RESPONSE (raw from Prisma)
// =============================================================================

export interface BackendConfigurator3DConfig {
  id: string;
  name: string;
  description?: string | null;
  slug?: string;
  productId?: string | null;
  type: ConfiguratorType;
  status: ConfiguratorStatus;
  modelUrl?: string | null;
  modelFormat?: string;
  thumbnailUrl?: string | null;
  sceneConfig?: unknown;
  cameraSettings?: unknown;
  pricingSettings?: unknown;
  uiConfig?: unknown;
  enableAR?: boolean;
  enableScreenshots?: boolean;
  enableSharing?: boolean;
  enablePricing?: boolean;
  enableComparison?: boolean;
  components?: Array<{
    id: string;
    name: string;
    technicalId?: string | null;
    description?: string | null;
    type: string;
    selectionMode: SelectionMode;
    isRequired: boolean;
    minSelections: number;
    maxSelections: number;
    sortOrder: number;
    isVisible: boolean;
    isEnabled: boolean;
    iconUrl?: string | null;
    previewImageUrl?: string | null;
    bounds?: unknown;
    cameraFocusPoint?: unknown;
    dependencies?: string[];
    options: Array<{
      id: string;
      componentId?: string | null;
      name: string;
      sku?: string | null;
      description?: string | null;
      type: OptionType;
      value?: string | null;
      values?: unknown;
      sortOrder: number;
      isDefault: boolean;
      isEnabled: boolean;
      isVisible: boolean;
      previewImageUrl?: string | null;
      swatchImageUrl?: string | null;
      inStock?: boolean;
      stockQuantity?: number | null;
      leadTimeDays?: number | null;
      textureUrls?: unknown;
      modelUrl?: string | null;
      priceDelta?: number;
      pricingType?: PricingType;
      priceModifier?: number;
      priceFormula?: string | null;
      currency?: string;
    }>;
  }>;
  rules?: Array<{
    id: string;
    name: string;
    description?: string | null;
    type: RuleType;
    conditions: unknown;
    actions: unknown;
    priority: number;
    isEnabled: boolean;
  }>;
}

// =============================================================================
// EXPORT OPTIONS
// =============================================================================

export interface ExportPDFOptions {
  template?: 'a4' | 'letter';
  includeSpecs?: boolean;
  includePrice?: boolean;
  customLogo?: string;
  language?: string;
}

export interface ExportAROptions {
  format?: 'usdz' | 'glb';
  quality?: 'low' | 'medium' | 'high';
  optimizeForMobile?: boolean;
}

export interface Export3DOptions {
  format?: 'glb' | 'gltf';
  includeTextures?: boolean;
}

export interface ExportImageOptions {
  format?: 'png' | 'jpeg' | 'webp';
  width?: number;
  height?: number;
  quality?: number;
}

// =============================================================================
// EVENT LISTENER TYPES
// =============================================================================

export type Configurator3DEventCallback = (event: Configurator3DEvent) => void;

export type Configurator3DEventType = Configurator3DEvent['type'];
