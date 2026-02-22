/**
 * WebXR session provider.
 * Starts immersive-ar session and optionally loads a model.
 * @module ar/platforms/WebXRProvider
 */

import { logger } from '@/lib/logger';
import { WebXRManager } from '../core/WebXRManager';
import type { WebXRSessionFeature } from '../core/WebXRManager';

export interface WebXRLaunchOptions {
  canvas?: HTMLCanvasElement;
  requiredFeatures?: WebXRSessionFeature[];
  optionalFeatures?: WebXRSessionFeature[];
  onSessionStarted?: (session: XRSession) => void;
  onSessionEnded?: () => void;
  onError?: (error: Error) => void;
}

const defaultOptional: WebXRSessionFeature[] = [
  'hit-test',
  'plane-detection',
  'light-estimation',
  'anchors',
];

/**
 * Launch WebXR immersive-ar session.
 * Does not load a model; use ARSceneManager with the session for that.
 */
export async function launch(
  _gltfUrl?: string,
  options: WebXRLaunchOptions = {}
): Promise<{ session: XRSession | null; manager: WebXRManager }> {
  const manager = new WebXRManager();

  manager.on('sessionStarted', (session: XRSession) => {
    options.onSessionStarted?.(session);
  });
  manager.on('sessionEnded', () => {
    options.onSessionEnded?.();
  });
  manager.on('error', (err: Error) => {
    options.onError?.(err);
  });

  const supported = await manager.initialize();
  if (!supported) {
    const err = new Error('WebXR immersive-ar not supported');
    options.onError?.(err);
    return { session: null, manager };
  }

  const session = await manager.startSession(
    {
      required: options.requiredFeatures ?? [],
      optional: options.optionalFeatures ?? defaultOptional,
    },
    options.canvas
  );

  if (!session) {
    return { session: null, manager };
  }

  return { session, manager };
}

/**
 * Check if WebXR immersive-ar is available (without starting a session).
 */
export async function isSupported(): Promise<boolean> {
  const manager = new WebXRManager();
  return manager.initialize();
}
