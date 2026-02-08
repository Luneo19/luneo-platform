/**
 * 3D Export Utility
 * 
 * Utilitaire pour exporter des modèles 3D dans différents formats
 * Utilisé par 3D Configurator et autres composants 3D
 */

import { logger } from '@/lib/logger';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export interface ExportOptions {
  format: 'glb' | 'gltf' | 'usdz' | 'obj' | 'stl';
  quality?: 'low' | 'medium' | 'high';
  includeTextures?: boolean;
  includeAnimations?: boolean;
  compression?: boolean;
}

/**
 * Exporte un modèle Three.js en GLB
 */
export async function exportToGLB(
  scene: THREE.Scene | THREE.Group,
  options: ExportOptions = { format: 'glb' }
): Promise<Blob> {
  try {
    const exporter = new GLTFExporter();
    
    const exportOptions = {
      binary: true,
      includeCustomExtensions: true,
      onlyVisible: false,
      truncateDrawRange: true,
      embedImages: options.includeTextures !== false,
      animations: options.includeAnimations !== false,
    };

    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result: unknown) => {
          try {
            if (result instanceof ArrayBuffer) {
              const blob = new Blob([result], { type: 'model/gltf-binary' });
              resolve(blob);
            } else {
              reject(new Error('Invalid GLB export result'));
            }
          } catch (error) {
            logger.error('Error processing GLB export', error as Error);
            reject(error);
          }
        },
        (error: ErrorEvent) => {
          logger.error('Error exporting to GLB', { error });
          reject(error);
        }
      );
    });
  } catch (error) {
    logger.error('Error in exportToGLB', error as Error);
    throw error;
  }
}

/**
 * Exporte un modèle Three.js en GLTF (JSON)
 */
export async function exportToGLTF(
  scene: THREE.Scene | THREE.Group,
  options: ExportOptions = { format: 'gltf' }
): Promise<string> {
  try {
    const exporter = new GLTFExporter();
    
    const exportOptions = {
      binary: false,
      includeCustomExtensions: true,
      onlyVisible: false,
      truncateDrawRange: true,
      embedImages: options.includeTextures !== false,
      animations: options.includeAnimations !== false,
    };

    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result: unknown) => {
          try {
            if (typeof result === 'string') {
              resolve(result);
            } else if (result instanceof Object) {
              resolve(JSON.stringify(result, null, 2));
            } else {
              reject(new Error('Invalid GLTF export result'));
            }
          } catch (error) {
            logger.error('Error processing GLTF export', error as Error);
            reject(error);
          }
        },
        (error: ErrorEvent) => {
          logger.error('Error exporting to GLTF', { error });
          reject(error);
        }
      );
    });
  } catch (error) {
    logger.error('Error in exportToGLTF', error as Error);
    throw error;
  }
}

/**
 * Exporte un modèle en PNG (screenshot)
 */
export async function exportToPNG(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { width?: number; height?: number; quality?: number } = {}
): Promise<Blob> {
  try {
    const { width = 2048, height = 2048, quality = 1.0 } = options;

    // Ajuster la taille du renderer
    const originalSize = renderer.getSize(new THREE.Vector2());
    renderer.setSize(width, height, false);

    // Rendre la scène
    renderer.render(scene, camera);

    // Capturer l'image
    const dataURL = renderer.domElement.toDataURL('image/png', quality);

    // Restaurer la taille originale
    renderer.setSize(originalSize.x, originalSize.y, false);

    // Convertir en Blob
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          quality
        );
      };
      img.onerror = (error) => {
        logger.error('Error loading image for PNG export', { error });
        reject(error);
      };
      img.src = dataURL;
    });
  } catch (error) {
    logger.error('Error in exportToPNG', error as Error);
    throw error;
  }
}

/**
 * Nettoie les ressources Three.js pour éviter les memory leaks
 */
export function disposeThreeJSResources(object: THREE.Object3D): void {
  try {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Géométrie
        if (child.geometry) {
          child.geometry.dispose();
        }

        // Matériaux
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => disposeMaterial(material));
          } else {
            disposeMaterial(child.material);
          }
        }
      }
    });
  } catch (error) {
    logger.error('Error disposing Three.js resources', error as Error);
  }
}

/**
 * Nettoie un matériau Three.js
 */
function disposeMaterial(material: THREE.Material): void {
  try {
    // Textures
    Object.keys(material).forEach((key) => {
      const value = (material as Record<string, unknown>)[key];
      if (value && value instanceof THREE.Texture) {
        value.dispose();
      }
    });

    // Matériau lui-même
    material.dispose();
  } catch (error) {
    logger.error('Error disposing material', error as Error);
  }
}

/**
 * Télécharge un blob avec un nom de fichier
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL après un délai
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    logger.error('Error downloading blob', error as Error);
    throw error;
  }
}

