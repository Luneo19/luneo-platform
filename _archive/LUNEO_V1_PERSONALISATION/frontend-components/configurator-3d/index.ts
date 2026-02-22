/**
 * 3D Configurator - Main barrel file
 * Exports all configurator-3d components
 */

// Core
export {
  Configurator3D,
  Configurator3DProvider,
  Configurator3DCanvas,
  Configurator3DUI,
} from './core';

// Viewer
export { SceneManager, ModelLoader, CameraController } from './viewer';

// Selectors
export {
  ComponentSelector,
  OptionSelector,
  ColorPicker,
  MaterialPicker,
  SwatchGrid,
} from './selectors';
export type {
  SwatchItem,
  SwatchGridProps,
  ColorPickerProps,
  ColorCategory,
  MaterialPickerProps,
  OptionSelectorProps,
  ComponentSelectorProps,
} from './selectors';

// Panels
export {
  ComponentPanel,
  PricingPanel,
  SummaryPanel,
  HistoryPanel,
  PriceAnimator,
} from './panels';
export type {
  ComponentPanelProps,
  PricingPanelProps,
  SummaryPanelProps,
  HistoryPanelProps,
  PriceAnimatorProps,
} from './panels';

// Actions
export {
  AddToCartButton,
  SaveDesignButton,
  ShareButton,
  ScreenshotButton,
  ARButton,
  ResetButton,
  ExportButton,
} from './actions';
export type {
  AddToCartButtonProps,
  SaveDesignButtonProps,
  ShareButtonProps,
  ScreenshotButtonProps,
  ARButtonProps,
  ResetButtonProps,
  ExportButtonProps,
} from './actions';

// Modals
export {
  SaveDesignModal,
  ShareModal,
  ExportModal,
  ScreenshotModal,
} from './modals';
export type {
  SaveDesignModalProps,
  ShareModalProps,
  ExportModalProps,
  ExportType,
  ScreenshotModalProps,
} from './modals';

// Admin
export {
  ComponentsEditor,
  RulesEditor,
  EmbedCodeGenerator,
  PricingEditor,
  OptionsEditor,
  ConfigurationForm,
} from './admin';

// Analytics
export {
  ConfiguratorAnalytics,
  SessionsTable,
  ConversionFunnel,
  OptionHeatmap,
  RevenueChart,
} from './analytics';

// Mobile
export { MobileConfigurator, BottomSheet } from './mobile';

// Embed
export {
  EmbeddedConfigurator,
  PostMessageHandler,
  usePostMessage,
} from './embed';
export type { PostMessageType, PostMessagePayload } from './embed';
