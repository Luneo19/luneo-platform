/**
 * Model Viewer Config Service
 * Generates configuration for &lt;model-viewer&gt; fallback when WebXR/AR is not available.
 * Used for desktop or unsupported mobile browsers.
 */

import { Injectable, Logger } from '@nestjs/common';

/** Attributes and props for <model-viewer> element */
export interface ModelViewerConfig {
  /** URL to glTF/GLB or USDZ model */
  src: string;
  /** Poster image URL (optional) */
  poster?: string;
  /** Alt text */
  alt: string;
  /** Enable AR mode (AR Quick Look / Scene Viewer) when available */
  ar?: boolean;
  /** AR mode: 'webxr' | 'quick-look' | 'scene-viewer' */
  arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
  /** Camera controls: 'enable' | 'disable' */
  cameraControls?: boolean;
  /** Auto-rotate */
  autoRotate?: boolean;
  /** Shadow intensity */
  shadowIntensity?: number;
  /** Environment image for reflections (optional) */
  environmentImage?: string;
  /** Exposure (optional) */
  exposure?: number;
}

/** Input to build model-viewer config */
export interface ModelViewerConfigInput {
  /** Model URL (glTF/GLB preferred for cross-platform) */
  modelUrl: string;
  /** Optional USDZ URL for iOS AR Quick Look */
  usdzUrl?: string;
  /** Optional poster/thumbnail URL */
  posterUrl?: string;
  /** Display name for alt */
  alt: string;
  /** Enable AR button in model-viewer */
  ar?: boolean;
  /** Prefer WebXR when available */
  arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
  /** Camera controls */
  cameraControls?: boolean;
  /** Auto-rotate */
  autoRotate?: boolean;
}

@Injectable()
export class ModelViewerConfigService {
  private readonly logger = new Logger(ModelViewerConfigService.name);

  /**
   * Builds configuration for the &lt;model-viewer&gt; web component.
   * Use this to render a 3D model with optional AR when WebXR/native AR is unavailable.
   *
   * @param input - model URL, optional USDZ, poster, alt, and options
   * @returns ModelViewerConfig for binding to model-viewer
   */
  getConfig(input: ModelViewerConfigInput): ModelViewerConfig {
    const {
      modelUrl,
      usdzUrl,
      posterUrl,
      alt,
      ar = true,
      arMode = 'webxr',
      cameraControls = true,
      autoRotate = false,
    } = input;

    const config: ModelViewerConfig = {
      src: modelUrl,
      poster: posterUrl,
      alt: alt || '3D model',
      ar,
      arMode,
      cameraControls,
      autoRotate,
      shadowIntensity: 1,
      exposure: 1,
    };

    this.logger.debug(`Model-viewer config for ${modelUrl}, ar=${ar}`);

    return config;
  }

  /**
   * Returns only the attributes needed for server-side or static rendering of model-viewer.
   */
  getAttributes(input: ModelViewerConfigInput): Record<string, string | number | boolean> {
    const config = this.getConfig(input);
    const attrs: Record<string, string | number | boolean> = {
      src: config.src,
      alt: config.alt,
      'camera-controls': config.cameraControls ?? true,
      'auto-rotate': config.autoRotate ?? false,
      'shadow-intensity': config.shadowIntensity ?? 1,
    };
    if (config.poster) attrs['poster'] = config.poster;
    if (config.ar) attrs['ar'] = config.ar;
    if (config.arMode) attrs['ar-mode'] = config.arMode;
    if (config.exposure != null) attrs['exposure'] = config.exposure;
    return attrs;
  }
}
