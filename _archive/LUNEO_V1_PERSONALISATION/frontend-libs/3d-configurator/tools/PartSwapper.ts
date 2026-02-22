import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Configurator3D, Part3D } from '../core/Configurator3D';
import { logger } from '@/lib/logger';

export interface PartVariant {
  id: string;
  name: string;
  partId: string;
  glbUrl: string;
  thumbnail: string;
  price?: number;
  description?: string;
  tags?: string[];
  available: boolean;
}

export interface PartCategory {
  id: string;
  name: string;
  meshName: string;
  variants: PartVariant[];
  required: boolean;
  multipleSelection: boolean;
}

export class PartSwapper {
  private configurator: Configurator3D;
  private loader: GLTFLoader;
  private partCategories: Map<string, PartCategory> = new Map();
  private currentParts: Map<string, PartVariant> = new Map();
  private partCache: Map<string, THREE.Group> = new Map();

  constructor(configurator: Configurator3D) {
    this.configurator = configurator;
    this.loader = new GLTFLoader();
    this.initializePartCategories();
  }

  private initializePartCategories() {
    // Watch Straps
    this.addPartCategory({
      id: 'watch-straps',
      name: 'Watch Straps',
      meshName: 'strap',
      required: true,
      multipleSelection: false,
      variants: [
        {
          id: 'leather-strap-black',
          name: 'Black Leather Strap',
          partId: 'watch-straps',
          glbUrl: '/models/watch/straps/leather-black.glb',
          thumbnail: '/models/watch/straps/leather-black-thumb.jpg',
          price: 29.99,
          description: 'Premium black leather watch strap',
          tags: ['leather', 'classic', 'formal'],
          available: true,
        },
        {
          id: 'leather-strap-brown',
          name: 'Brown Leather Strap',
          partId: 'watch-straps',
          glbUrl: '/models/watch/straps/leather-brown.glb',
          thumbnail: '/models/watch/straps/leather-brown-thumb.jpg',
          price: 29.99,
          description: 'Classic brown leather watch strap',
          tags: ['leather', 'casual', 'vintage'],
          available: true,
        },
        {
          id: 'metal-strap-silver',
          name: 'Silver Metal Strap',
          partId: 'watch-straps',
          glbUrl: '/models/watch/straps/metal-silver.glb',
          thumbnail: '/models/watch/straps/metal-silver-thumb.jpg',
          price: 49.99,
          description: 'Stainless steel metal strap',
          tags: ['metal', 'modern', 'durable'],
          available: true,
        },
        {
          id: 'silicone-strap-black',
          name: 'Black Silicone Strap',
          partId: 'watch-straps',
          glbUrl: '/models/watch/straps/silicone-black.glb',
          thumbnail: '/models/watch/straps/silicone-black-thumb.jpg',
          price: 19.99,
          description: 'Sporty silicone watch strap',
          tags: ['silicone', 'sport', 'waterproof'],
          available: true,
        },
      ],
    });

    // Shoe Laces
    this.addPartCategory({
      id: 'shoe-laces',
      name: 'Shoe Laces',
      meshName: 'laces',
      required: true,
      multipleSelection: false,
      variants: [
        {
          id: 'round-laces-white',
          name: 'White Round Laces',
          partId: 'shoe-laces',
          glbUrl: '/models/shoes/laces/round-white.glb',
          thumbnail: '/models/shoes/laces/round-white-thumb.jpg',
          price: 5.99,
          description: 'Classic white round laces',
          tags: ['round', 'classic', 'white'],
          available: true,
        },
        {
          id: 'flat-laces-black',
          name: 'Black Flat Laces',
          partId: 'shoe-laces',
          glbUrl: '/models/shoes/laces/flat-black.glb',
          thumbnail: '/models/shoes/laces/flat-black-thumb.jpg',
          price: 5.99,
          description: 'Modern flat black laces',
          tags: ['flat', 'modern', 'black'],
          available: true,
        },
        {
          id: 'elastic-laces-multi',
          name: 'Multi-Color Elastic Laces',
          partId: 'shoe-laces',
          glbUrl: '/models/shoes/laces/elastic-multi.glb',
          thumbnail: '/models/shoes/laces/elastic-multi-thumb.jpg',
          price: 7.99,
          description: 'No-tie elastic laces',
          tags: ['elastic', 'sport', 'colorful'],
          available: true,
        },
      ],
    });

    // Bag Buckles
    this.addPartCategory({
      id: 'bag-buckles',
      name: 'Bag Buckles',
      meshName: 'buckle',
      required: true,
      multipleSelection: false,
      variants: [
        {
          id: 'metal-buckle-silver',
          name: 'Silver Metal Buckle',
          partId: 'bag-buckles',
          glbUrl: '/models/bags/buckles/metal-silver.glb',
          thumbnail: '/models/bags/buckles/metal-silver-thumb.jpg',
          price: 12.99,
          description: 'Polished silver metal buckle',
          tags: ['metal', 'silver', 'classic'],
          available: true,
        },
        {
          id: 'metal-buckle-gold',
          name: 'Gold Metal Buckle',
          partId: 'bag-buckles',
          glbUrl: '/models/bags/buckles/metal-gold.glb',
          thumbnail: '/models/bags/buckles/metal-gold-thumb.jpg',
          price: 14.99,
          description: 'Luxury gold metal buckle',
          tags: ['metal', 'gold', 'luxury'],
          available: true,
        },
        {
          id: 'magnetic-buckle-black',
          name: 'Black Magnetic Buckle',
          partId: 'bag-buckles',
          glbUrl: '/models/bags/buckles/magnetic-black.glb',
          thumbnail: '/models/bags/buckles/magnetic-black-thumb.jpg',
          price: 16.99,
          description: 'Modern magnetic closure buckle',
          tags: ['magnetic', 'modern', 'black'],
          available: true,
        },
      ],
    });

    // Phone Case Buttons
    this.addPartCategory({
      id: 'case-buttons',
      name: 'Case Buttons',
      meshName: 'buttons',
      required: false,
      multipleSelection: true,
      variants: [
        {
          id: 'metal-buttons-silver',
          name: 'Silver Metal Buttons',
          partId: 'case-buttons',
          glbUrl: '/models/cases/buttons/metal-silver.glb',
          thumbnail: '/models/cases/buttons/metal-silver-thumb.jpg',
          price: 4.99,
          description: 'Metal button accents',
          tags: ['metal', 'silver', 'accent'],
          available: true,
        },
        {
          id: 'colored-buttons-red',
          name: 'Red Colored Buttons',
          partId: 'case-buttons',
          glbUrl: '/models/cases/buttons/colored-red.glb',
          thumbnail: '/models/cases/buttons/colored-red-thumb.jpg',
          price: 3.99,
          description: 'Vibrant red button accents',
          tags: ['colored', 'red', 'vibrant'],
          available: true,
        },
      ],
    });

    // Jewelry Charms
    this.addPartCategory({
      id: 'jewelry-charms',
      name: 'Jewelry Charms',
      meshName: 'charm',
      required: false,
      multipleSelection: true,
      variants: [
        {
          id: 'heart-charm-gold',
          name: 'Gold Heart Charm',
          partId: 'jewelry-charms',
          glbUrl: '/models/jewelry/charms/heart-gold.glb',
          thumbnail: '/models/jewelry/charms/heart-gold-thumb.jpg',
          price: 24.99,
          description: '14k gold heart charm',
          tags: ['gold', 'heart', 'romantic'],
          available: true,
        },
        {
          id: 'star-charm-silver',
          name: 'Silver Star Charm',
          partId: 'jewelry-charms',
          glbUrl: '/models/jewelry/charms/star-silver.glb',
          thumbnail: '/models/jewelry/charms/star-silver-thumb.jpg',
          price: 19.99,
          description: 'Sterling silver star charm',
          tags: ['silver', 'star', 'celestial'],
          available: true,
        },
        {
          id: 'crystal-charm-clear',
          name: 'Clear Crystal Charm',
          partId: 'jewelry-charms',
          glbUrl: '/models/jewelry/charms/crystal-clear.glb',
          thumbnail: '/models/jewelry/charms/crystal-clear-thumb.jpg',
          price: 29.99,
          description: 'Swarovski crystal charm',
          tags: ['crystal', 'sparkle', 'luxury'],
          available: true,
        },
      ],
    });
  }

  addPartCategory(category: PartCategory): void {
    this.partCategories.set(category.id, category);
  }

  getPartCategory(id: string): PartCategory | undefined {
    return this.partCategories.get(id);
  }

  getAllPartCategories(): PartCategory[] {
    return Array.from(this.partCategories.values());
  }

  getPartVariants(categoryId: string): PartVariant[] {
    const category = this.partCategories.get(categoryId);
    return category ? category.variants : [];
  }

  async swapPart(variantId: string): Promise<boolean> {
    // Find variant
    let selectedVariant: PartVariant | undefined;
    let category: PartCategory | undefined;

    for (const cat of this.partCategories.values()) {
      const variant = cat.variants.find(v => v.id === variantId);
      if (variant) {
        selectedVariant = variant;
        category = cat;
        break;
      }
    }

    if (!selectedVariant || !category) {
      logger.error('Variant not found', {
        variantId,
      });
      return false;
    }

    if (!selectedVariant.available) {
      logger.warn('Variant not available', {
        variantId,
        categoryId: category.id,
      });
      return false;
    }

    try {
      // Load part from cache or GLB
      let partGroup: THREE.Group;
      
      if (this.partCache.has(variantId)) {
        partGroup = this.partCache.get(variantId)!.clone();
      } else {
        const gltf = await this.loader.loadAsync(selectedVariant.glbUrl);
        partGroup = gltf.scene;
        this.partCache.set(variantId, partGroup.clone());
      }

      // Create Part3D object
      const part: Part3D = {
        id: variantId,
        name: selectedVariant.name,
        meshName: category.meshName,
        glbUrl: selectedVariant.glbUrl,
      };

      // Swap in configurator
      await this.configurator.swapPart(variantId, part);

      // Update current parts
      if (!category.multipleSelection) {
        // Replace existing part in category
        this.currentParts.set(category.id, selectedVariant);
      } else {
        // Add to collection (for multi-select categories like charms)
        const key = `${category.id}-${variantId}`;
        this.currentParts.set(key, selectedVariant);
      }

      return true;
    } catch (error) {
      logger.error('Error swapping part', {
        error,
        variantId,
        categoryId: category.id,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async removePart(categoryId: string, variantId?: string): Promise<boolean> {
    const category = this.partCategories.get(categoryId);
    
    if (!category) {
      return false;
    }

    if (category.required) {
      logger.warn('Cannot remove required part', {
        categoryId,
        categoryName: category.name,
      });
      return false;
    }

    try {
      const model = this.configurator.getModel();
      
      if (!model) {
        return false;
      }

      if (category.multipleSelection && variantId) {
        // Remove specific variant
        const key = `${categoryId}-${variantId}`;
        const part = model.getObjectByName(category.meshName + '-' + variantId);
        
        if (part) {
          model.remove(part);
          this.currentParts.delete(key);
        }
      } else {
        // Remove all parts in category
        const parts = model.children.filter(child => 
          child.name.startsWith(category.meshName)
        );
        
        parts.forEach(part => model.remove(part));
        this.currentParts.delete(categoryId);
      }

      return true;
    } catch (error) {
      logger.error('Error removing part', {
        error,
        categoryId,
        variantId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  getCurrentParts(): Map<string, PartVariant> {
    return this.currentParts;
  }

  getCurrentPartsByCategory(categoryId: string): PartVariant[] {
    const category = this.partCategories.get(categoryId);
    
    if (!category) {
      return [];
    }

    if (!category.multipleSelection) {
      const part = this.currentParts.get(categoryId);
      return part ? [part] : [];
    } else {
      // Get all parts for this category
      const parts: PartVariant[] = [];
      
      for (const [key, variant] of this.currentParts.entries()) {
        if (key.startsWith(categoryId + '-')) {
          parts.push(variant);
        }
      }
      
      return parts;
    }
  }

  calculateTotalPrice(): number {
    let total = 0;
    
    for (const variant of this.currentParts.values()) {
      total += variant.price || 0;
    }
    
    return total;
  }

  searchParts(query: string, categoryId?: string): PartVariant[] {
    const results: PartVariant[] = [];
    const lowerQuery = query.toLowerCase();

    const categoriesToSearch = categoryId 
      ? [this.partCategories.get(categoryId)].filter(Boolean) as PartCategory[]
      : Array.from(this.partCategories.values());

    for (const category of categoriesToSearch) {
      for (const variant of category.variants) {
        const matchesName = variant.name.toLowerCase().includes(lowerQuery);
        const matchesDescription = variant.description?.toLowerCase().includes(lowerQuery);
        const matchesTags = variant.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

        if (matchesName || matchesDescription || matchesTags) {
          results.push(variant);
        }
      }
    }

    return results;
  }

  getPartsByTag(tag: string): PartVariant[] {
    const results: PartVariant[] = [];
    const lowerTag = tag.toLowerCase();

    for (const category of this.partCategories.values()) {
      for (const variant of category.variants) {
        if (variant.tags?.some(t => t.toLowerCase() === lowerTag)) {
          results.push(variant);
        }
      }
    }

    return results;
  }

  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required parts
    for (const category of this.partCategories.values()) {
      if (category.required) {
        const hasPart = this.currentParts.has(category.id);
        
        if (!hasPart) {
          errors.push(`Required part missing: ${category.name}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  exportConfiguration(): string {
    const config = {
      parts: Array.from(this.currentParts.entries()),
      totalPrice: this.calculateTotalPrice(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    return JSON.stringify(config, null, 2);
  }

  async importConfiguration(configJson: string): Promise<boolean> {
    try {
      const config = JSON.parse(configJson);

      if (!config.parts || !Array.isArray(config.parts)) {
        throw new Error('Invalid configuration format');
      }

      // Clear current parts
      this.currentParts.clear();

      // Load each part
      for (const [, variant] of config.parts) {
        await this.swapPart(variant.id);
      }

      return true;
    } catch (error) {
      logger.error('Error importing configuration', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  preloadParts(variantIds: string[]): Promise<void[]> {
    const promises = variantIds.map(async (variantId) => {
      if (this.partCache.has(variantId)) {
        return;
      }

      // Find variant
      for (const category of this.partCategories.values()) {
        const variant = category.variants.find(v => v.id === variantId);
        
        if (variant) {
          try {
            const gltf = await this.loader.loadAsync(variant.glbUrl);
            this.partCache.set(variantId, gltf.scene);
          } catch (error) {
            logger.error('Error preloading part', {
              error,
              variantId,
              glbUrl: variant.glbUrl,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
          }
          break;
        }
      }
    });

    return Promise.all(promises);
  }

  clearCache(): void {
    this.partCache.clear();
  }

  getCacheSize(): number {
    return this.partCache.size;
  }
}

export default PartSwapper;
