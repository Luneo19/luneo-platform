/**
 * Adapt PBR materials for AR: metalness, roughness, envMap from light estimate.
 * @module ar/rendering/PBRMaterialAdapter
 */

import * as THREE from 'three';
import type { ARLightState } from './ARLightEstimation';

export type MaterialPreset = 'jewelry' | 'furniture' | 'default';

/**
 * Adapt a PBR material for AR rendering (light estimate, env map, preset).
 */
export function adaptForAR(
  material: THREE.Material,
  lightEstimate: ARLightState | null
): void {
  if (!(material as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;

  const mat = material as THREE.MeshStandardMaterial;
  mat.envMapIntensity = 1;
  if (lightEstimate) {
    const intensity = Math.min(1.5, lightEstimate.ambientIntensity);
    mat.envMapIntensity = intensity;
  }
  mat.needsUpdate = true;
}

/**
 * Optimize material for jewelry (high metalness, low roughness, strong reflections).
 */
export function optimizeForJewelry(material: THREE.Material): void {
  if (!(material as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;

  const mat = material as THREE.MeshStandardMaterial;
  mat.metalness = 0.95;
  mat.roughness = 0.1;
  mat.envMapIntensity = 1.2;
  mat.needsUpdate = true;
}

/**
 * Optimize material for furniture (standard PBR).
 */
export function optimizeForFurniture(material: THREE.Material): void {
  if (!(material as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;

  const mat = material as THREE.MeshStandardMaterial;
  mat.metalness = 0.3;
  mat.roughness = 0.6;
  mat.envMapIntensity = 1;
  mat.needsUpdate = true;
}

/**
 * Apply preset to material.
 */
export function applyPreset(material: THREE.Material, preset: MaterialPreset): void {
  switch (preset) {
    case 'jewelry':
      optimizeForJewelry(material);
      break;
    case 'furniture':
      optimizeForFurniture(material);
      break;
    default:
      break;
  }
}

/**
 * Traverse object and apply preset to all MeshStandardMaterials.
 */
export function applyPresetToObject(
  object: THREE.Object3D,
  preset: MaterialPreset
): void {
  object.traverse((node) => {
    if ((node as THREE.Mesh).isMesh) {
      const mesh = node as THREE.Mesh;
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => applyPreset(m, preset));
      } else if (mesh.material) {
        applyPreset(mesh.material, preset);
      }
    }
  });
}
