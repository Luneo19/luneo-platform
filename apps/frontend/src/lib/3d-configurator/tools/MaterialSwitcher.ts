import * as THREE from 'three';
import { Material3D } from '../core/Configurator3D';
import { logger } from '@/lib/logger';

export interface MaterialPreset {
  id: string;
  name: string;
  category: 'leather' | 'fabric' | 'metal' | 'plastic' | 'wood' | 'glass' | 'special';
  material: Material3D;
  thumbnail: string;
  description?: string;
}

export class MaterialSwitcher {
  private materialPresets: Map<string, MaterialPreset> = new Map();
  private textureLoader: THREE.TextureLoader;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.initializePresets();
  }

  private initializePresets() {
    // Leather Materials
    this.addPreset({
      id: 'leather-black',
      name: 'Black Leather',
      category: 'leather',
      material: {
        id: 'leather-black',
        name: 'Black Leather',
        type: 'leather',
        baseColor: '#1a1a1a',
        roughness: 0.8,
        metalness: 0.0,
        normalMapUrl: '/textures/leather/black/normal.jpg',
        roughnessMapUrl: '/textures/leather/black/roughness.jpg',
      },
      thumbnail: '/textures/leather/black/thumb.jpg',
      description: 'Premium black leather with authentic texture',
    });

    this.addPreset({
      id: 'leather-brown',
      name: 'Brown Leather',
      category: 'leather',
      material: {
        id: 'leather-brown',
        name: 'Brown Leather',
        type: 'leather',
        baseColor: '#8B4513',
        roughness: 0.7,
        metalness: 0.0,
        normalMapUrl: '/textures/leather/brown/normal.jpg',
        roughnessMapUrl: '/textures/leather/brown/roughness.jpg',
      },
      thumbnail: '/textures/leather/brown/thumb.jpg',
      description: 'Classic brown leather with natural grain',
    });

    // Fabric Materials
    this.addPreset({
      id: 'fabric-cotton',
      name: 'Cotton',
      category: 'fabric',
      material: {
        id: 'fabric-cotton',
        name: 'Cotton',
        type: 'fabric',
        baseColor: '#ffffff',
        roughness: 0.9,
        metalness: 0.0,
        normalMapUrl: '/textures/fabric/cotton/normal.jpg',
        roughnessMapUrl: '/textures/fabric/cotton/roughness.jpg',
      },
      thumbnail: '/textures/fabric/cotton/thumb.jpg',
      description: 'Soft cotton fabric with natural texture',
    });

    this.addPreset({
      id: 'fabric-denim',
      name: 'Denim',
      category: 'fabric',
      material: {
        id: 'fabric-denim',
        name: 'Denim',
        type: 'fabric',
        baseColor: '#4169E1',
        roughness: 0.8,
        metalness: 0.0,
        normalMapUrl: '/textures/fabric/denim/normal.jpg',
        roughnessMapUrl: '/textures/fabric/denim/roughness.jpg',
      },
      thumbnail: '/textures/fabric/denim/thumb.jpg',
      description: 'Classic blue denim with woven texture',
    });

    // Metal Materials
    this.addPreset({
      id: 'metal-steel',
      name: 'Brushed Steel',
      category: 'metal',
      material: {
        id: 'metal-steel',
        name: 'Brushed Steel',
        type: 'metal',
        baseColor: '#C0C0C0',
        roughness: 0.3,
        metalness: 0.9,
        normalMapUrl: '/textures/metal/steel/normal.jpg',
        roughnessMapUrl: '/textures/metal/steel/roughness.jpg',
        metalnessMapUrl: '/textures/metal/steel/metalness.jpg',
      },
      thumbnail: '/textures/metal/steel/thumb.jpg',
      description: 'Brushed stainless steel with metallic finish',
    });

    this.addPreset({
      id: 'metal-gold',
      name: 'Gold',
      category: 'metal',
      material: {
        id: 'metal-gold',
        name: 'Gold',
        type: 'metal',
        baseColor: '#FFD700',
        roughness: 0.1,
        metalness: 1.0,
        normalMapUrl: '/textures/metal/gold/normal.jpg',
        roughnessMapUrl: '/textures/metal/gold/roughness.jpg',
        metalnessMapUrl: '/textures/metal/gold/metalness.jpg',
      },
      thumbnail: '/textures/metal/gold/thumb.jpg',
      description: 'Luxurious gold with high reflectivity',
    });

    this.addPreset({
      id: 'metal-copper',
      name: 'Copper',
      category: 'metal',
      material: {
        id: 'metal-copper',
        name: 'Copper',
        type: 'metal',
        baseColor: '#B87333',
        roughness: 0.2,
        metalness: 0.8,
        normalMapUrl: '/textures/metal/copper/normal.jpg',
        roughnessMapUrl: '/textures/metal/copper/roughness.jpg',
        metalnessMapUrl: '/textures/metal/copper/metalness.jpg',
      },
      thumbnail: '/textures/metal/copper/thumb.jpg',
      description: 'Warm copper with natural patina',
    });

    // Plastic Materials
    this.addPreset({
      id: 'plastic-matte',
      name: 'Matte Plastic',
      category: 'plastic',
      material: {
        id: 'plastic-matte',
        name: 'Matte Plastic',
        type: 'plastic',
        baseColor: '#ffffff',
        roughness: 0.9,
        metalness: 0.0,
        normalMapUrl: '/textures/plastic/matte/normal.jpg',
        roughnessMapUrl: '/textures/plastic/matte/roughness.jpg',
      },
      thumbnail: '/textures/plastic/matte/thumb.jpg',
      description: 'Smooth matte plastic finish',
    });

    this.addPreset({
      id: 'plastic-glossy',
      name: 'Glossy Plastic',
      category: 'plastic',
      material: {
        id: 'plastic-glossy',
        name: 'Glossy Plastic',
        type: 'plastic',
        baseColor: '#ffffff',
        roughness: 0.1,
        metalness: 0.0,
        normalMapUrl: '/textures/plastic/glossy/normal.jpg',
        roughnessMapUrl: '/textures/plastic/glossy/roughness.jpg',
      },
      thumbnail: '/textures/plastic/glossy/thumb.jpg',
      description: 'High-gloss plastic with mirror finish',
    });

    // Wood Materials
    this.addPreset({
      id: 'wood-oak',
      name: 'Oak Wood',
      category: 'wood',
      material: {
        id: 'wood-oak',
        name: 'Oak Wood',
        type: 'wood',
        baseColor: '#DEB887',
        roughness: 0.8,
        metalness: 0.0,
        normalMapUrl: '/textures/wood/oak/normal.jpg',
        roughnessMapUrl: '/textures/wood/oak/roughness.jpg',
        aoMapUrl: '/textures/wood/oak/ao.jpg',
      },
      thumbnail: '/textures/wood/oak/thumb.jpg',
      description: 'Natural oak wood with grain texture',
    });

    this.addPreset({
      id: 'wood-walnut',
      name: 'Walnut Wood',
      category: 'wood',
      material: {
        id: 'wood-walnut',
        name: 'Walnut Wood',
        type: 'wood',
        baseColor: '#8B4513',
        roughness: 0.7,
        metalness: 0.0,
        normalMapUrl: '/textures/wood/walnut/normal.jpg',
        roughnessMapUrl: '/textures/wood/walnut/roughness.jpg',
        aoMapUrl: '/textures/wood/walnut/ao.jpg',
      },
      thumbnail: '/textures/wood/walnut/thumb.jpg',
      description: 'Rich walnut wood with dark grain',
    });

    // Glass Materials
    this.addPreset({
      id: 'glass-clear',
      name: 'Clear Glass',
      category: 'glass',
      material: {
        id: 'glass-clear',
        name: 'Clear Glass',
        type: 'glass',
        baseColor: '#ffffff',
        roughness: 0.0,
        metalness: 0.0,
        normalMapUrl: '/textures/glass/clear/normal.jpg',
        roughnessMapUrl: '/textures/glass/clear/roughness.jpg',
      },
      thumbnail: '/textures/glass/clear/thumb.jpg',
      description: 'Crystal clear glass with transparency',
    });

    this.addPreset({
      id: 'glass-tinted',
      name: 'Tinted Glass',
      category: 'glass',
      material: {
        id: 'glass-tinted',
        name: 'Tinted Glass',
        type: 'glass',
        baseColor: '#1a1a1a',
        roughness: 0.0,
        metalness: 0.0,
        normalMapUrl: '/textures/glass/tinted/normal.jpg',
        roughnessMapUrl: '/textures/glass/tinted/roughness.jpg',
      },
      thumbnail: '/textures/glass/tinted/thumb.jpg',
      description: 'Dark tinted glass with privacy',
    });

    // Special Materials
    this.addPreset({
      id: 'carbon-fiber',
      name: 'Carbon Fiber',
      category: 'special',
      material: {
        id: 'carbon-fiber',
        name: 'Carbon Fiber',
        type: 'custom',
        baseColor: '#2C2C2C',
        roughness: 0.2,
        metalness: 0.1,
        normalMapUrl: '/textures/special/carbon/normal.jpg',
        roughnessMapUrl: '/textures/special/carbon/roughness.jpg',
        metalnessMapUrl: '/textures/special/carbon/metalness.jpg',
      },
      thumbnail: '/textures/special/carbon/thumb.jpg',
      description: 'High-tech carbon fiber weave',
    });

    this.addPreset({
      id: 'brushed-aluminum',
      name: 'Brushed Aluminum',
      category: 'special',
      material: {
        id: 'brushed-aluminum',
        name: 'Brushed Aluminum',
        type: 'custom',
        baseColor: '#E5E5E5',
        roughness: 0.4,
        metalness: 0.7,
        normalMapUrl: '/textures/special/aluminum/normal.jpg',
        roughnessMapUrl: '/textures/special/aluminum/roughness.jpg',
        metalnessMapUrl: '/textures/special/aluminum/metalness.jpg',
      },
      thumbnail: '/textures/special/aluminum/thumb.jpg',
      description: 'Anodized aluminum with brush finish',
    });
  }

  addPreset(preset: MaterialPreset): void {
    this.materialPresets.set(preset.id, preset);
  }

  getPreset(id: string): MaterialPreset | undefined {
    return this.materialPresets.get(id);
  }

  getAllPresets(): MaterialPreset[] {
    return Array.from(this.materialPresets.values());
  }

  getPresetsByCategory(category: string): MaterialPreset[] {
    return this.getAllPresets().filter(preset => preset.category === category);
  }

  getCategories(): string[] {
    const categories = new Set(this.getAllPresets().map(preset => preset.category));
    return Array.from(categories);
  }

  createCustomMaterial(options: {
    name: string;
    baseColor: string;
    roughness?: number;
    metalness?: number;
    normalMapUrl?: string;
    roughnessMapUrl?: string;
    metalnessMapUrl?: string;
    aoMapUrl?: string;
  }): Material3D {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      name: options.name,
      type: 'custom',
      baseColor: options.baseColor,
      roughness: options.roughness || 0.5,
      metalness: options.metalness || 0.0,
      normalMapUrl: options.normalMapUrl,
      roughnessMapUrl: options.roughnessMapUrl,
      metalnessMapUrl: options.metalnessMapUrl,
      aoMapUrl: options.aoMapUrl,
    };
  }

  async loadMaterialTextures(material: Material3D): Promise<THREE.MeshStandardMaterial> {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(material.baseColor),
      roughness: material.roughness,
      metalness: material.metalness,
    });

    // Load textures asynchronously
    const texturePromises: Promise<void>[] = [];

    if (material.normalMapUrl) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            material.normalMapUrl!,
            (texture) => {
              mat.normalMap = texture;
              mat.needsUpdate = true;
              resolve();
            },
            undefined,
            reject
          );
        })
      );
    }

    if (material.roughnessMapUrl) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            material.roughnessMapUrl!,
            (texture) => {
              mat.roughnessMap = texture;
              mat.needsUpdate = true;
              resolve();
            },
            undefined,
            reject
          );
        })
      );
    }

    if (material.metalnessMapUrl) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            material.metalnessMapUrl!,
            (texture) => {
              mat.metalnessMap = texture;
              mat.needsUpdate = true;
              resolve();
            },
            undefined,
            reject
          );
        })
      );
    }

    if (material.aoMapUrl) {
      texturePromises.push(
        new Promise((resolve, reject) => {
          this.textureLoader.load(
            material.aoMapUrl!,
            (texture) => {
              mat.aoMap = texture;
              mat.aoMapIntensity = 1;
              mat.needsUpdate = true;
              resolve();
            },
            undefined,
            reject
          );
        })
      );
    }

    await Promise.all(texturePromises);
    return mat;
  }

  generateMaterialPreview(material: Material3D, size: number = 128): string {
    // Create a simple sphere preview
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Create gradient for material preview
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, material.baseColor);
    gradient.addColorStop(1, this.darkenColor(material.baseColor, 0.3));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Add material type indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(material.type.toUpperCase(), size/2, size - 8);

    return canvas.toDataURL();
  }

  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
    
    return `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }

  exportMaterialLibrary(): string {
    const library = {
      presets: Array.from(this.materialPresets.entries()),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify(library, null, 2);
  }

  importMaterialLibrary(libraryJson: string): void {
    try {
      const library = JSON.parse(libraryJson);
      
      if (library.presets && Array.isArray(library.presets)) {
        library.presets.forEach(([id, preset]: [string, MaterialPreset]) => {
          this.materialPresets.set(id, preset);
        });
      }
    } catch (error) {
      logger.error('Error importing material library', {
        error,
        libraryJson: typeof libraryJson === 'string' ? libraryJson.substring(0, 100) : 'object',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default MaterialSwitcher;
