/**
 * @luneo/ar-export - USDZ Converter professionnel
 * Conversion GLB → USDZ pour AR Quick Look iOS
 */

/**
 * Options de conversion USDZ
 */
export interface USDZConversionOptions {
  /** URL du fichier GLB source */
  glbUrl: string;
  
  /** Nom du produit */
  productName?: string;
  
  /** Scale du modèle */
  scale?: number;
  
  /** Position initiale */
  position?: [number, number, number];
  
  /** Rotation initiale (degrés) */
  rotation?: [number, number, number];
  
  /** Activer ombres */
  enableShadows?: boolean;
  
  /** URL de destination pour upload */
  uploadUrl?: string;
}

/**
 * Résultat de conversion
 */
export interface USDZConversionResult {
  /** URL du fichier USDZ */
  usdzUrl: string;
  
  /** Taille du fichier (bytes) */
  fileSize: number;
  
  /** Temps de conversion (ms) */
  conversionTime: number;
  
  /** Métadonnées */
  metadata: {
    productName: string;
    scale: number;
    format: 'usdz';
    createdAt: string;
  };
}

/**
 * USDZ Converter professionnel
 * 
 * Features:
 * - Conversion GLB → USDZ
 * - Support AR Quick Look iOS
 * - Configuration scale/position/rotation
 * - Upload automatique vers storage
 * - Optimisation fichier
 * 
 * Note: La conversion USDZ nécessite un service backend car
 * le format USDZ n'est pas supporté nativement en JavaScript.
 * On utilise une API externe ou un service Python.
 * 
 * @example
 * ```typescript
 * const converter = new USDZConverter({
 *   apiUrl: 'https://api.luneo.app/ar/convert-usdz'
 * });
 * 
 * const result = await converter.convert({
 *   glbUrl: '/models/product.glb',
 *   productName: 'Sunglasses',
 *   scale: 1.0
 * });
 * 
 * console.log('USDZ:', result.usdzUrl);
 * ```
 */
export class USDZConverter {
  private apiUrl: string;

  constructor(config: { apiUrl: string }) {
    this.apiUrl = config.apiUrl;
  }

  /**
   * Convertit GLB vers USDZ
   */
  async convert(options: USDZConversionOptions): Promise<USDZConversionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Converting GLB to USDZ...', options.glbUrl);
      
      // Préparer la requête
      const requestBody = {
        glb_url: options.glbUrl,
        product_name: options.productName || 'Product',
        scale: options.scale || 1.0,
        position: options.position || [0, 0, 0],
        rotation: options.rotation || [0, 0, 0],
        enable_shadows: options.enableShadows !== false,
      };
      
      // Appeler l'API de conversion
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Conversion failed: ${response.statusText}`
        );
      }
      
      const data = await response.json();
      
      const conversionTime = Date.now() - startTime;
      
      console.log('✅ USDZ conversion completed', {
        time: `${conversionTime}ms`,
        url: data.usdz_url,
      });
      
      return {
        usdzUrl: data.usdz_url,
        fileSize: data.file_size || 0,
        conversionTime,
        metadata: {
          productName: options.productName || 'Product',
          scale: options.scale || 1.0,
          format: 'usdz',
          createdAt: new Date().toISOString(),
        },
      };
      
    } catch (error) {
      console.error('❌ USDZ conversion failed:', error);
      throw error;
    }
  }

  /**
   * Batch conversion (plusieurs modèles)
   */
  async convertBatch(
    options: USDZConversionOptions[]
  ): Promise<USDZConversionResult[]> {
    console.log(`🔄 Converting ${options.length} models to USDZ...`);
    
    const promises = options.map(opt => this.convert(opt));
    const results = await Promise.all(promises);
    
    console.log(`✅ Batch conversion completed: ${results.length} files`);
    
    return results;
  }

  /**
   * Vérifie si un USDZ existe déjà (cache check)
   */
  async checkExists(glbUrl: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiUrl}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glb_url: glbUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.usdz_url || null;
      }
      
      return null;
    } catch {
      return null;
    }
  }
}

