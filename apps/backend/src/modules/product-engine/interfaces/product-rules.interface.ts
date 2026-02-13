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

export interface CompatibilityRule {
  if: Record<string, unknown>;
  deny?: string[];
  allow?: string[];
  require?: string[];
  priceMultiplier?: number;
}

export interface ProductRules {
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
  zones: Record<string, any>;
  materials?: Record<string, any>;
  finishes?: Record<string, any>;
  quantity?: number;
  customizations?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  price: number;
  estimatedProductionTime?: number;
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


