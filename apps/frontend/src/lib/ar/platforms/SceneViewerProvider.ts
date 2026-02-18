/**
 * Android Scene Viewer provider.
 * Opens glTF/GLB via intent:// URL for ARCore.
 * @module ar/platforms/SceneViewerProvider
 */

import { logger } from '@/lib/logger';
import { detectCapabilities } from '../core/XRDeviceDetector';

export interface SceneViewerOptions {
  /** Title shown in Scene Viewer */
  title?: string;
  /** Link shown to user */
  link?: string;
  /** Fallback URL if Scene Viewer not available */
  fallbackUrl?: string;
  /** Use WebXR instead if supported */
  preferWebXR?: boolean;
}

const INTENT_ORIGIN = 'https://arvr.google.com/scene-viewer/1.0';

/**
 * Check if Scene Viewer is supported (Android with ARCore).
 */
export async function isSupported(): Promise<boolean> {
  const caps = await detectCapabilities();
  return caps.platform === 'android' && caps.arSession;
}

/**
 * Build Scene Viewer intent URL for a glTF/GLB model.
 */
export function buildIntentUrl(gltfUrl: string, options: SceneViewerOptions = {}): string {
  const params = new URLSearchParams();
  params.set('file', gltfUrl);
  if (options.title) params.set('title', options.title);
  if (options.link) params.set('link', options.link);
  if (options.fallbackUrl) params.set('fallback_url', options.fallbackUrl);

  const query = params.toString();
  return `${INTENT_ORIGIN}?${query}`;
}

/**
 * Launch Scene Viewer (or fallback to WebXR if preferWebXR and supported).
 */
export async function launch(
  gltfUrl: string,
  options: SceneViewerOptions = {}
): Promise<{ launched: boolean; method: 'scene-viewer' | 'webxr' | 'none' }> {
  if (!gltfUrl || !gltfUrl.startsWith('http')) {
    logger.error('SceneViewerProvider: invalid gltfUrl', { gltfUrl });
    return { launched: false, method: 'none' };
  }

  const caps = await detectCapabilities();

  if (options.preferWebXR && caps.arSession) {
    return { launched: false, method: 'webxr' };
  }

  if (caps.platform !== 'android') {
    logger.warn('SceneViewerProvider: not Android', { platform: caps.platform });
    return { launched: false, method: 'none' };
  }

  const intentUrl = buildIntentUrl(gltfUrl, options);
  const a = document.createElement('a');
  a.href = intentUrl;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  logger.info('SceneViewerProvider: launched', { gltfUrl: gltfUrl.slice(0, 80) });
  return { launched: true, method: 'scene-viewer' };
}
