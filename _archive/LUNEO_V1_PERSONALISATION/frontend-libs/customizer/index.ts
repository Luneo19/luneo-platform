/**
 * Customizer Engine
 * Main exports for the Visual Customizer canvas engine
 */

// Engine
export { CustomizerEngine } from './engine/CustomizerEngine';
export type { EngineConfig, ExportOptions as EngineExportOptions } from './engine/CustomizerEngine';

export { CanvasManager } from './engine/CanvasManager';
export type { CanvasConfig, ExportOptions as CanvasExportOptions } from './engine/CanvasManager';

export { ObjectManager } from './engine/ObjectManager';
export type {
  TextConfig,
  ImageConfig,
  ShapeConfig,
  DrawingLineConfig,
  QRCodeConfig,
} from './engine/ObjectManager';

export { SelectionManager } from './engine/SelectionManager';
export type { SelectionCallbacks } from './engine/SelectionManager';

export { HistoryManager } from './engine/HistoryManager';
export type { HistoryEntry } from './engine/HistoryManager';

// Zones
export { ZoneManager } from './zones/ZoneManager';
export { ZoneConstraints } from './zones/ZoneConstraints';
export type { ZoneConfig } from './types';

// Text
export { FontManager } from './text/FontManager';
export type { CustomFont } from './text/FontManager';

export { TextRenderer } from './text/TextRenderer';
export type { TextStyle, TextEditCallbacks } from './text/TextRenderer';

// Images
export { ImageLoader } from './images/ImageLoader';
export type { ImageLoadOptions } from './images/ImageLoader';

export { ImageProcessor } from './images/ImageProcessor';
export { FilterType } from './images/ImageProcessor';

export { ImageCropper } from './images/ImageCropper';
export type { CropRect } from './images/ImageCropper';

// Export
export { ImageExporter } from './export/ImageExporter';
export type {
  ExportOptions as ImageExportOptions,
  ExportAreaOptions,
} from './export/ImageExporter';

export { PDFExporter } from './export/PDFExporter';
export type { PDFExportOptions } from './export/PDFExporter';

// Pricing
export { PricingCalculator } from './pricing/PricingCalculator';
export type { PricingSettings, PriceItem, PricingResult } from './pricing/PricingCalculator';

// Validation
export { ContentValidator } from './validation/ContentValidator';
export type {
  ValidationError,
  ValidationResult,
  ValidationSettings,
} from './validation/ContentValidator';
