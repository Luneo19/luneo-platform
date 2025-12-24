/**
 * Interfaces pour validation CAD paramétrique
 */

export interface GeometricConstraints {
  minThickness?: number; // Épaisseur minimale (mm)
  maxThickness?: number; // Épaisseur maximale (mm)
  minRadius?: number; // Rayon de courbure minimal (mm)
  maxWeight?: number; // Poids maximal (g)
  minRingSize?: number; // Taille bague minimale (US)
  maxRingSize?: number; // Taille bague maximale (US)
}

export interface SettingConstraints {
  minClawThickness?: number; // Épaisseur griffe minimale (mm)
  minPaveSpacing?: number; // Espacement pavé minimal (mm)
  maxStoneSize?: number; // Taille pierre maximale (mm)
  minStoneSize?: number; // Taille pierre minimale (mm)
}

export interface CollisionConstraints {
  checkStoneClawCollision?: boolean; // Vérifier collision pierres/griffes
  checkStoneStoneCollision?: boolean; // Vérifier collision pierres/pierres
  minClearance?: number; // Espacement minimal (mm)
}

export interface CADValidationRequest {
  designId: string;
  productId: string;
  parameters: {
    ringSize?: number;
    metal?: string;
    thickness?: number;
    stones?: Array<{
      type: string;
      size: number; // mm
      position: { x: number; y: number; z: number };
    }>;
    setting?: {
      type: 'claw' | 'pave' | 'channel' | 'bezel';
      parameters?: any;
    };
  };
  constraints: {
    geometric?: GeometricConstraints;
    setting?: SettingConstraints;
    collision?: CollisionConstraints;
  };
}

export interface CADValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'thickness' | 'radius' | 'weight' | 'collision' | 'setting' | 'tolerance';
    message: string;
    severity: 'error' | 'warning';
    parameter?: string;
    value?: number;
    constraint?: number;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    recommendation?: string;
  }>;
  estimatedWeight?: number; // g
  estimatedCost?: number; // cents
  manufacturingFeasibility?: {
    feasible: boolean;
    complexity: 'simple' | 'medium' | 'complex' | 'very-complex';
    estimatedTime?: number; // heures
  };
}




















