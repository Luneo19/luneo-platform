/**
 * Coûts en crédits par endpoint IA
 * Optimisé pour marge élevée (2275% sur DALL-E 3)
 */

export const ENDPOINT_COSTS: Record<string, number> = {
  // Génération IA
  '/api/ai/generate': 5,                    // DALL-E 3 standard (1024x1024)
  '/api/ai/generate/hd': 10,                // DALL-E 3 HD (1792x1024 ou 1024x1792)
  '/api/ai/background-removal': 2,          // Remove.bg ou équivalent
  '/api/ai/extract-colors': 1,              // Analyse simple
  '/api/ai/variants': 3,                    // Génération 3 variantes
  
  // Rendus
  '/api/3d/render-highres': 8,              // Rendu 3D haute résolution
  '/api/ar/convert-2d-to-3d': 15,           // Conversion 2D→3D complexe
  '/api/ar/convert-usdz': 5,                // Export AR (.usdz)
  
  // Customization
  '/api/customization/generate': 4,         // Personnalisation IA
  '/api/designs/save-custom': 1,           // Sauvegarde design personnalisé
};

/**
 * Coûts réels estimés (en centimes) pour analytics et optimisation
 */
export const REAL_COSTS_CENTS: Record<string, number> = {
  '/api/ai/generate': 4,                    // ~$0.04 DALL-E 3 standard
  '/api/ai/generate/hd': 8,                 // ~$0.08 DALL-E 3 HD
  '/api/ai/background-removal': 1,          // ~$0.01 Remove.bg
  '/api/ai/extract-colors': 0,              // Gratuit (local processing)
  '/api/ai/variants': 12,                   // 3 × 4 centimes
  '/api/3d/render-highres': 2,              // ~$0.02 Cloud rendering
  '/api/ar/convert-2d-to-3d': 3,           // ~$0.03 Processing
  '/api/ar/convert-usdz': 1,                // ~$0.01 Conversion
  '/api/customization/generate': 2,         // ~$0.02 AI processing
  '/api/designs/save-custom': 0,           // Gratuit (DB only)
};

/**
 * Calculer la marge pour un endpoint
 */
export function calculateMargin(endpoint: string): {
  creditsCost: number;
  realCostCents: number;
  revenueCents: number;
  marginPercent: number;
} {
  const credits = ENDPOINT_COSTS[endpoint] || 1;
  const realCost = REAL_COSTS_CENTS[endpoint] || 0;
  
  // Prix de vente: 0.19€ par crédit (pack 100)
  const revenueCents = credits * 19;
  const marginCents = revenueCents - realCost;
  const marginPercent = realCost > 0 ? (marginCents / realCost) * 100 : 0;

  return {
    creditsCost: credits,
    realCostCents: realCost,
    revenueCents,
    marginPercent: Math.round(marginPercent),
  };
}

/**
 * Obtenir le coût en crédits pour un endpoint
 */
export function getEndpointCost(endpoint: string): number {
  return ENDPOINT_COSTS[endpoint] || 1;
}

/**
 * Obtenir le coût réel estimé pour un endpoint
 */
export function getRealCost(endpoint: string): number {
  return REAL_COSTS_CENTS[endpoint] || 0;
}


