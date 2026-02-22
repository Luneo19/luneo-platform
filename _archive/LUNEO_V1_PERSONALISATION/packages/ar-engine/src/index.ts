/**
 * @luneo/ar-engine
 * Moteur AR pour Virtual Try-On
 */

export { ARScene, type ARSceneConfig, type ProductType } from "./core/ARScene";
export { FaceDetector, type FaceLandmarks } from "./detectors/FaceDetector";
export { HandDetector, type HandLandmarks } from "./detectors/HandDetector";
export { GlassesPlacement } from "./placement/GlassesPlacement";
export { JewelryPlacement } from "./placement/JewelryPlacement";

