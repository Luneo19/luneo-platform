export interface ProductZone {
  id: string;
  label: string;
  type: 'image' | 'text' | 'color' | 'select';
  x: number;
  y: number;
  width: number;
  height: number;
  allowedMime?: string[];
  maxResolution?: { w: number; h: number };
  priceDeltaCents?: number;
  constraints?: ZoneConstraints;
  metadata?: Record<string, unknown>;
}

export interface ZoneConstraints {
  noTransparency?: boolean;
  maxChars?: number;
  allowedFonts?: string[];
  allowedColors?: string[];
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  required?: boolean;
  pattern?: string; // Regex for text validation
}

export type CompatibilityCondition = Record<string, unknown>;

export interface CompatibilityRule {
  if: CompatibilityCondition;
  deny?: string[];
  allow?: string[];
  require?: string[];
  priceMultiplier?: number;
}

export interface ProductRules {
  [key: string]: unknown;
  zones: ProductZone[];
  compatibilityRules?: CompatibilityRule[];
  globalConstraints?: GlobalConstraints;
  pricing?: PricingRules;
  metadata?: Record<string, unknown>;
}

export interface GlobalConstraints {
  maxTotalPrice?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  allowedMaterials?: string[];
  allowedFinishes?: string[];
  productionTime?: number; // in hours
}

export interface PricingRules {
  basePrice: number;
  zonePricing: Record<string, number>;
  materialPricing: Record<string, number>;
  finishPricing: Record<string, number>;
  quantityDiscounts?: QuantityDiscount[];
  bulkPricing?: BulkPricing[];
}

export interface QuantityDiscount {
  minQuantity: number;
  discountPercent: number;
}

export interface BulkPricing {
  tier: string;
  minQuantity: number;
  pricePerUnit: number;
}

export interface DesignOptions {
  [key: string]: unknown;
  zones?: Record<string, DesignZoneOption>;
  materials?: Record<string, number>;
  finishes?: Record<string, number>;
  quantity?: number;
  quality?: 'standard' | 'high' | 'ultra';
  numImages?: number;
  size?: string;
  style?: string;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  effects?: string[];
  zoneTypes?: string[];
  customizations?: {
    effects?: string[];
  } & Record<string, unknown>;
}

export interface DesignImageZoneOptions {
  imageUrl?: string;
  imageFile?: unknown;
  mimeType?: string;
  width?: number;
  height?: number;
  hasTransparency?: boolean;
  quality?: number;
  complexity?: 'simple' | 'medium' | 'complex';
  effects?: string[];
}

export interface DesignTextZoneOptions {
  text?: string;
  font?: string;
  effects?: string[];
}

export interface DesignColorZoneOptions {
  color?: string;
  gradient?: boolean;
}

export interface DesignSelectZoneOptions {
  value?: string;
}

export type DesignZoneOption =
  | DesignImageZoneOptions
  | DesignTextZoneOptions
  | DesignColorZoneOptions
  | DesignSelectZoneOptions;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  price: number;
  estimatedProductionTime?: number;
  [key: string]: unknown;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  zone?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface ZoneValidationContext {
  productId: string;
  brandId: string;
  userId?: string;
  options: DesignOptions;
  rules: ProductRules;
}

export interface PricingContext {
  baseProduct: {
    id: string;
    price: number;
    material?: string;
    finish?: string;
  };
  options: DesignOptions;
  rules: ProductRules;
  brandTier?: 'basic' | 'professional' | 'enterprise';
  quantity: number;
}

export interface PricingSuggestion {
  recommendedBasePrice: number;
  competitiveAnalysis: CompetitiveAnalysis;
  marginAnalysis: MarginAnalysis;
  priceHistory: PricingHistoryEntry[];
}

export interface CompetitiveAnalysis {
  marketAverage: number;
  priceRange: {
    min: number;
    max: number;
  };
  competitors: Array<{
    name: string;
    price: number;
  }>;
}

export interface MarginAnalysis {
  currentMarginPercent: number;
  targetMarginPercent: number;
  recommendation: string;
}

export interface PricingHistoryEntry {
  total: number;
  date: string;
}

export interface RulesUsageStats {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  designs: Record<string, number>;
  orders: number;
}


