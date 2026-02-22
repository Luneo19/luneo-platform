/**
 * AR Rendering module.
 * @module ar/rendering
 */

export { ARSceneManager } from './ARSceneManager';
export type { ARSceneManagerConfig } from './ARSceneManager';

export { ARLightEstimation } from './ARLightEstimation';
export type { ARLightState } from './ARLightEstimation';

export { ARShadowRenderer } from './ARShadowRenderer';
export type { ShadowQuality } from './ARShadowRenderer';

export { ARReflectionProbe } from './ARReflectionProbe';

export {
  adaptForAR,
  optimizeForJewelry,
  optimizeForFurniture,
  applyPreset,
  applyPresetToObject,
} from './PBRMaterialAdapter';
export type { MaterialPreset } from './PBRMaterialAdapter';
