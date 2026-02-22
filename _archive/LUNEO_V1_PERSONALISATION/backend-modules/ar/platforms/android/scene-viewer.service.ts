/**
 * Scene Viewer Service (Android)
 * Google Scene Viewer integration: generates intent:// URLs for Scene Viewer,
 * with fallback to WebXR when ARCore is available. Supports inline 3D model viewer.
 */

import { Injectable, Logger } from '@nestjs/common';

/** Options for generating a Scene Viewer intent URL */
export interface SceneViewerOptions {
  /** URL to the 3D model (glTF/GLB recommended) */
  modelUrl: string;
  /** Optional title for the experience */
  title?: string;
  /** Optional link to open when user taps "View in store" or similar */
  link?: string;
  /** Optional image URL for preview */
  imageUrl?: string;
}

/** Result with intent URL and fallback WebXR hint */
export interface SceneViewerResult {
  /** intent:// URL for Android Chrome Scene Viewer */
  intentUrl: string;
  /** Direct model URL for WebXR or inline viewer fallback */
  modelUrl: string;
  /** Whether to suggest WebXR as fallback when ARCore is available */
  webxrFallback: boolean;
}

/** Base intent URL for Google Scene Viewer */
const SCENE_VIEWER_BASE = 'https://arvr.google.com/scene-viewer/1.0';

@Injectable()
export class SceneViewerService {
  private readonly logger = new Logger(SceneViewerService.name);

  /**
   * Generates an intent:// URL for Google Scene Viewer (Android Chrome).
   * Use with an &lt;a href="intent/..."&gt; or window.location on Android.
   * Fallback: open modelUrl in WebXR or inline 3D viewer if Scene Viewer is unavailable.
   *
   * @param options - modelUrl, optional title, link, imageUrl
   * @returns intentUrl, modelUrl, and webxrFallback flag
   */
  getSceneViewerUrl(options: SceneViewerOptions): SceneViewerResult {
    const { modelUrl, title, link, imageUrl } = options;

    const params = new URLSearchParams();
    params.set('file', modelUrl);
    if (title) params.set('title', title);
    if (link) params.set('link', link);
    if (imageUrl) params.set('image', imageUrl);

    const sceneViewerUrl = `${SCENE_VIEWER_BASE}?${params.toString()}`;
    const intentUrl = this.buildIntentUrl(sceneViewerUrl);

    this.logger.debug(`Scene Viewer intent for model: ${modelUrl}`);

    return {
      intentUrl,
      modelUrl,
      webxrFallback: true,
    };
  }

  /**
   * Builds the intent:// URL string for Android.
   * Package com.google.android.googlequicksearchbox is used by Google app for Scene Viewer.
   */
  private buildIntentUrl(sceneViewerUrl: string): string {
    const u = new URL(sceneViewerUrl);
    const pathAndQuery = u.pathname + u.search;
    return `intent://${u.host}${pathAndQuery}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;end;`;
  }

  /**
   * Returns config for an inline 3D model viewer (e.g. model-viewer or custom WebGL).
   * Use when Scene Viewer is not available (e.g. in-app browser or Firefox).
   *
   * @param modelUrl - URL to glTF/GLB model
   * @param opts - optional title and poster image
   */
  getInlineViewerConfig(
    modelUrl: string,
    opts?: { title?: string; posterUrl?: string },
  ): { modelUrl: string; title?: string; posterUrl?: string } {
    return {
      modelUrl,
      title: opts?.title,
      posterUrl: opts?.posterUrl,
    };
  }
}
