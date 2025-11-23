import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { Configurator3D } from '../core/Configurator3D';
import { logger } from '@/lib/logger';

export interface ARExportOptions {
  format: 'usdz' | 'glb' | 'gltf';
  includeTextures?: boolean;
  binary?: boolean;
  maxTextureSize?: number;
  compression?: boolean;
  embedImages?: boolean;
  ios?: boolean;
  android?: boolean;
}

export interface ARMetadata {
  title?: string;
  description?: string;
  author?: string;
  copyright?: string;
  version?: string;
  generator?: string;
  scale?: number;
  animations?: boolean;
}

export class ARExporter {
  private configurator: Configurator3D;
  private gltfExporter: GLTFExporter;
  private usdzExporter: USDZExporter;

  constructor(configurator: Configurator3D) {
    this.configurator = configurator;
    this.gltfExporter = new GLTFExporter();
    this.usdzExporter = new USDZExporter();
  }

  /**
   * Export for iOS AR Quick Look (USDZ)
   */
  async exportForIOS(metadata: ARMetadata = {}): Promise<Blob> {
    const model = this.configurator.getModel();
    
    if (!model) {
      throw new Error('No model loaded');
    }

    try {
      // Optimize model for AR
      const optimizedModel = this.optimizeForAR(model.clone());
      optimizedModel.userData = { ...(optimizedModel.userData || {}), ...metadata };

      // Export to USDZ
      const usdzData = await this.usdzExporter.parseAsync(optimizedModel);
      
      return new Blob([usdzData], { type: 'model/vnd.usdz+zip' });
    } catch (error) {
      logger.error('Error exporting USDZ', {
        error,
        metadata,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export for Android Scene Viewer (GLB)
   */
  async exportForAndroid(options: Partial<ARExportOptions> = {}): Promise<Blob> {
    return this.exportGLB({
      format: 'glb',
      ...options,
      binary: true,
      compression: true,
      maxTextureSize: 2048,
    });
  }

  /**
   * Export GLB format
   */
  async exportGLB(options: Partial<ARExportOptions> = {}): Promise<Blob> {
    const model = this.configurator.getModel();
    
    if (!model) {
      throw new Error('No model loaded');
    }

    try {
      // Optimize model
      const optimizedModel = this.optimizeForAR(model.clone());
      if (options.android || options.ios) {
        optimizedModel.userData = {
          ...(optimizedModel.userData || {}),
          platform: options.android ? 'android' : 'ios',
        };
      }

      return new Promise((resolve, reject) => {
        this.gltfExporter.parse(
          optimizedModel,
          (result) => {
            if (result instanceof ArrayBuffer) {
              resolve(new Blob([result], { type: 'model/gltf-binary' }));
            } else {
              const json = JSON.stringify(result);
              resolve(new Blob([json], { type: 'model/gltf+json' }));
            }
          },
          (error) => {
            logger.error('Error exporting GLB', {
              error,
              options,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            reject(error);
          },
          {
            binary: options.binary !== false,
            maxTextureSize: options.maxTextureSize || 4096,
            embedImages: options.embedImages !== false,
          }
        );
      });
    } catch (error) {
      logger.error('Error in GLB export', {
        error,
        options,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export GLTF format
   */
  async exportGLTF(options: Partial<ARExportOptions> = {}): Promise<{ json: any; textures: Map<string, Blob> }> {
    const model = this.configurator.getModel();
    
    if (!model) {
      throw new Error('No model loaded');
    }

    try {
      const optimizedModel = this.optimizeForAR(model.clone());

      return new Promise((resolve, reject) => {
        this.gltfExporter.parse(
          optimizedModel,
          (result) => {
            resolve({
              json: result,
              textures: new Map(),
            });
          },
          (error) => {
            logger.error('Error exporting GLTF', {
              error,
              options,
              message: error instanceof Error ? error.message : 'Unknown error',
            });
            reject(error);
          },
          {
            binary: false,
            maxTextureSize: options.maxTextureSize || 4096,
          }
        );
      });
    } catch (error) {
      logger.error('Error in GLTF export', {
        error,
        options,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Optimize model for AR
   */
  private optimizeForAR(model: THREE.Group): THREE.Group {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Optimize geometry
        if (child.geometry) {
          child.geometry.computeVertexNormals();
          child.geometry.normalizeNormals();
        }

        // Optimize materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.optimizeMaterial(mat));
          } else {
            this.optimizeMaterial(child.material);
          }
        }
      }
    });

    return model;
  }

  /**
   * Optimize material for AR
   */
  private optimizeMaterial(material: THREE.Material): void {
    if (material instanceof THREE.MeshStandardMaterial) {
      // Ensure material is suitable for mobile AR
      material.flatShading = false;
      material.needsUpdate = true;

      // Compress textures if needed
      if (material.map) {
        this.optimizeTexture(material.map);
      }
      if (material.normalMap) {
        this.optimizeTexture(material.normalMap);
      }
      if (material.roughnessMap) {
        this.optimizeTexture(material.roughnessMap);
      }
      if (material.metalnessMap) {
        this.optimizeTexture(material.metalnessMap);
      }
    }
  }

  /**
   * Optimize texture for AR
   */
  private optimizeTexture(texture: THREE.Texture): void {
    // Use mipmaps for better performance
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }

  /**
   * Create AR Quick Look anchor tag for iOS
   */
  createIOSARLink(usdzUrl: string, title: string = 'View in AR'): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = usdzUrl;
    link.rel = 'ar';
    link.download = 'model.usdz';
    
    // ✅ Créer les éléments DOM de manière sécurisée (pas d'innerHTML)
    const img = document.createElement('img');
    img.src = 'ar-icon.png';
    img.alt = title; // Échappement automatique par le DOM
    
    const span = document.createElement('span');
    span.textContent = title; // textContent échappe automatiquement
    
    link.appendChild(img);
    link.appendChild(span);
    
    // iOS specific attributes (setAttribute échappe automatiquement)
    link.setAttribute('data-ar-title', title);
    link.setAttribute('data-ar-calltoaction', 'View in your space');
    
    return link;
  }

  /**
   * Create Scene Viewer intent for Android
   */
  createAndroidARIntent(glbUrl: string, title: string = 'View in AR'): string {
    const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(title)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(glbUrl)};end;`;
    
    return intentUrl;
  }

  /**
   * Generate AR compatible screenshot
   */
  async generateARScreenshot(width: number = 1024, height: number = 1024): Promise<string> {
    const renderer = this.configurator.getRenderer();
    const scene = this.configurator.getScene();
    const camera = this.configurator.getCamera();

    // Save current state
    const originalSize = new THREE.Vector2();
    renderer.getSize(originalSize);

    try {
      // Set high resolution
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      // Render
      renderer.render(scene, camera);

      // Get data URL
      const dataUrl = renderer.domElement.toDataURL('image/png');

      return dataUrl;
    } finally {
      // Restore original size
      renderer.setSize(originalSize.x, originalSize.y, false);
      camera.aspect = originalSize.x / originalSize.y;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Create WebXR compatible scene
   */
  createWebXRScene(): THREE.Scene {
    const scene = this.configurator.getScene().clone();
    
    // Add AR specific elements
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    reticle.name = 'ar-reticle';
    scene.add(reticle);

    return scene;
  }

  /**
   * Estimate file size
   */
  async estimateFileSize(format: 'usdz' | 'glb'): Promise<number> {
    try {
      let blob: Blob;
      
      if (format === 'usdz') {
        blob = await this.exportForIOS();
      } else {
        blob = await this.exportForAndroid();
      }
      
      return blob.size;
    } catch (error) {
      logger.error('Error estimating file size', {
        error,
        format,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Validate model for AR
   */
  validateForAR(): { valid: boolean; errors: string[]; warnings: string[] } {
    const model = this.configurator.getModel();
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!model) {
      errors.push('No model loaded');
      return { valid: false, errors, warnings };
    }

    let vertexCount = 0;
    let materialCount = 0;
    let textureCount = 0;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Count vertices
        if (child.geometry) {
          vertexCount += child.geometry.attributes.position?.count || 0;
        }

        // Count materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            materialCount += child.material.length;
          } else {
            materialCount++;
          }
        }

        // Count textures
        if (child.material instanceof THREE.MeshStandardMaterial) {
          if (child.material.map) textureCount++;
          if (child.material.normalMap) textureCount++;
          if (child.material.roughnessMap) textureCount++;
          if (child.material.metalnessMap) textureCount++;
        }
      }
    });

    // Check limits
    if (vertexCount > 100000) {
      warnings.push(`High vertex count: ${vertexCount} (recommended < 100,000)`);
    }

    if (vertexCount > 500000) {
      errors.push(`Vertex count too high: ${vertexCount} (max 500,000)`);
    }

    if (materialCount > 10) {
      warnings.push(`Many materials: ${materialCount} (recommended < 10)`);
    }

    if (textureCount > 20) {
      warnings.push(`Many textures: ${textureCount} (recommended < 20)`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get AR compatibility info
   */
  getARCompatibility(): {
    ios: boolean;
    android: boolean;
    webxr: boolean;
    fileSize: string;
    vertexCount: number;
  } {
    const model = this.configurator.getModel();
    let vertexCount = 0;

    if (model) {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          vertexCount += child.geometry.attributes.position?.count || 0;
        }
      });
    }

    return {
      ios: true, // USDZ supported
      android: true, // GLB supported
      webxr: 'xr' in navigator, // WebXR API available
      fileSize: 'Unknown',
      vertexCount,
    };
  }

  /**
   * Create AR marker/QR code data
   */
  generateARMarkerData(arUrl: string, title: string): string {
    return JSON.stringify({
      url: arUrl,
      title,
      timestamp: new Date().toISOString(),
      platform: 'universal',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(arUrl)}`,
    }, null, 2);
  }

  dispose(): void {
    // Cleanup if needed
  }
}

export default ARExporter;
