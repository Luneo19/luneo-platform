/**
 * @luneo/optimization - Materials Manager professionnel
 * Système PBR complet (Diffuse, Normal, Roughness, Metalness, AO)
 */

import * as THREE from 'three';

/**
 * Ensemble de textures PBR
 */
export interface PBRTextureSet {
  /** Diffuse/Albedo map */
  diffuse: string;
  
  /** Normal map */
  normal?: string;
  
  /** Roughness map */
  roughness?: string;
  
  /** Metalness map */
  metalness?: string;
  
  /** Ambient Occlusion map */
  ao?: string;
  
  /** Displacement map */
  displacement?: string;
}

/**
 * Material presets disponibles
 */
export const MATERIAL_PRESETS: Record<string, PBRTextureSet> = {
  leather_black: {
    diffuse: '/textures/leather/black_diffuse.jpg',
    normal: '/textures/leather/black_normal.jpg',
    roughness: '/textures/leather/black_roughness.jpg',
    ao: '/textures/leather/black_ao.jpg',
  },
  fabric_cotton: {
    diffuse: '/textures/fabric/cotton_diffuse.jpg',
    normal: '/textures/fabric/cotton_normal.jpg',
    roughness: '/textures/fabric/cotton_roughness.jpg',
  },
  metal_brushed: {
    diffuse: '/textures/metal/brushed_diffuse.jpg',
    normal: '/textures/metal/brushed_normal.jpg',
    roughness: '/textures/metal/brushed_roughness.jpg',
    metalness: '/textures/metal/brushed_metalness.jpg',
  },
  wood_oak: {
    diffuse: '/textures/wood/oak_diffuse.jpg',
    normal: '/textures/wood/oak_normal.jpg',
    roughness: '/textures/wood/oak_roughness.jpg',
    ao: '/textures/wood/oak_ao.jpg',
  },
  plastic_matte: {
    diffuse: '/textures/plastic/matte_diffuse.jpg',
    roughness: '/textures/plastic/matte_roughness.jpg',
  },
};

/**
 * Materials Manager professionnel
 * 
 * Features:
 * - PBR materials (Physically Based Rendering)
 * - Texture loading avec cache
 * - Material presets
 * - Color variation
 * - Hot swapping
 * 
 * @example
 * ```typescript
 * const manager = new MaterialsManager();
 * 
 * const leather = await manager.loadMaterial('leather_black');
 * mesh.material = leather;
 * 
 * // Changer couleur
 * manager.setColor(leather, '#8B4513');
 * ```
 */
export class MaterialsManager {
  private textureLoader: THREE.TextureLoader;
  private materialsCache: Map<string, THREE.Material> = new Map();
  private texturesCache: Map<string, THREE.Texture> = new Map();

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Charge un material depuis preset
   */
  async loadMaterial(presetName: string): Promise<THREE.MeshStandardMaterial> {
    // Check cache
    if (this.materialsCache.has(presetName)) {
      return this.materialsCache.get(presetName)!.clone() as THREE.MeshStandardMaterial;
    }
    
    const preset = MATERIAL_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Material preset '${presetName}' not found`);
    }
    
    console.log(`🎨 Loading material: ${presetName}...`);
    
    const material = await this.createPBRMaterial(preset);
    
    // Cache material
    this.materialsCache.set(presetName, material);
    
    console.log(`✅ Material loaded: ${presetName}`);
    
    return material.clone() as THREE.MeshStandardMaterial;
  }

  /**
   * Créer un PBR material depuis textures
   */
  async createPBRMaterial(textureSet: PBRTextureSet): Promise<THREE.MeshStandardMaterial> {
    const material = new THREE.MeshStandardMaterial();
    
    // Load textures en parallèle
    const texturePromises: Promise<void>[] = [];
    
    // Diffuse
    if (textureSet.diffuse) {
      texturePromises.push(
        this.loadTexture(textureSet.diffuse).then(tex => {
          material.map = tex;
        })
      );
    }
    
    // Normal
    if (textureSet.normal) {
      texturePromises.push(
        this.loadTexture(textureSet.normal).then(tex => {
          material.normalMap = tex;
        })
      );
    }
    
    // Roughness
    if (textureSet.roughness) {
      texturePromises.push(
        this.loadTexture(textureSet.roughness).then(tex => {
          material.roughnessMap = tex;
        })
      );
    }
    
    // Metalness
    if (textureSet.metalness) {
      texturePromises.push(
        this.loadTexture(textureSet.metalness).then(tex => {
          material.metalnessMap = tex;
        })
      );
    }
    
    // AO
    if (textureSet.ao) {
      texturePromises.push(
        this.loadTexture(textureSet.ao).then(tex => {
          material.aoMap = tex;
        })
      );
    }
    
    // Displacement
    if (textureSet.displacement) {
      texturePromises.push(
        this.loadTexture(textureSet.displacement).then(tex => {
          material.displacementMap = tex;
          material.displacementScale = 0.1;
        })
      );
    }
    
    await Promise.all(texturePromises);
    
    material.needsUpdate = true;
    
    return material;
  }

  /**
   * Charge une texture (avec cache)
   */
  private async loadTexture(url: string): Promise<THREE.Texture> {
    // Check cache
    if (this.texturesCache.has(url)) {
      return this.texturesCache.get(url)!;
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Optimize texture
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          // Cache texture
          this.texturesCache.set(url, texture);
          
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Change la couleur d'un material
   */
  setColor(material: THREE.MeshStandardMaterial, color: string | number): void {
    material.color.set(color);
    material.needsUpdate = true;
  }

  /**
   * Applique un material à un mesh
   */
  applyToMesh(mesh: THREE.Mesh, material: THREE.Material): void {
    // Dispose old material
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => mat.dispose());
    } else {
      mesh.material.dispose();
    }
    
    mesh.material = material;
  }

  /**
   * Applique un material à tous les meshes d'un objet
   */
  applyToObject(object: THREE.Object3D, material: THREE.Material): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.applyToMesh(child, material);
      }
    });
  }

  /**
   * Nettoie le cache
   */
  dispose(): void {
    this.materialsCache.forEach(mat => mat.dispose());
    this.materialsCache.clear();
    
    this.texturesCache.forEach(tex => tex.dispose());
    this.texturesCache.clear();
    
    console.log('MaterialsManager disposed');
  }
}

