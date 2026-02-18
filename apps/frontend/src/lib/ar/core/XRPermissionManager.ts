/**
 * Handle XR-related permissions (camera, motion).
 * iOS may require motion permission for AR.
 * @module ar/core/XRPermissionManager
 */

import { logger } from '@/lib/logger';

export type XRPermissionType = 'camera' | 'motion';

export type XRPermissionEvent = 'permissionGranted' | 'permissionDenied';

export type XRPermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface XRPermissionResult {
  camera: XRPermissionStatus;
  motion: XRPermissionStatus;
}

const EVENT_LISTENERS: Map<XRPermissionEvent, Set<(type: XRPermissionType) => void>> = new Map([
  ['permissionGranted', new Set()],
  ['permissionDenied', new Set()],
]);

/**
 * Request camera permission (e.g. for AR).
 * Typically triggered by user gesture.
 */
export async function requestCameraPermission(): Promise<XRPermissionStatus> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'unsupported';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    emit('permissionGranted', 'camera');
    return 'granted';
  } catch (err) {
    logger.warn('XRPermissionManager: camera denied', { error: String(err) });
    emit('permissionDenied', 'camera');
    return 'denied';
  }
}

/**
 * Request device motion permission (iOS 13+).
 * Required for some AR experiences on Safari/iOS.
 */
export async function requestMotionPermission(): Promise<XRPermissionStatus> {
  if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
    return 'unsupported';
  }

  const requestPermission = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
  if (typeof requestPermission !== 'function') {
    return 'granted'; // Non-iOS or already granted
  }

  try {
    const result = await requestPermission();
    if (result === 'granted') {
      emit('permissionGranted', 'motion');
      return 'granted';
    }
    emit('permissionDenied', 'motion');
    return 'denied';
  } catch (err) {
    logger.warn('XRPermissionManager: motion denied', { error: String(err) });
    emit('permissionDenied', 'motion');
    return 'denied';
  }
}

/**
 * Check current permission state without prompting.
 */
export async function checkAllPermissions(): Promise<XRPermissionResult> {
  let camera: XRPermissionStatus = 'unsupported';
  let motion: XRPermissionStatus = 'unsupported';

  if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as PermissionName });
      camera = cam.state as XRPermissionStatus;
    } catch {
      camera = 'prompt';
    }
  }

  if (typeof DeviceMotionEvent !== 'undefined' && (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission) {
    motion = 'prompt'; // iOS: need to call requestPermission to know
  }

  return { camera, motion };
}

function emit(event: XRPermissionEvent, type: XRPermissionType): void {
  EVENT_LISTENERS.get(event)?.forEach((fn) => {
    try {
      fn(type);
    } catch (e) {
      logger.error('XRPermissionManager: listener error', { event, error: String(e) });
    }
  });
}

/**
 * Subscribe to permission events.
 */
export function onPermissionGranted(fn: (type: XRPermissionType) => void): () => void {
  EVENT_LISTENERS.get('permissionGranted')!.add(fn);
  return () => EVENT_LISTENERS.get('permissionGranted')!.delete(fn);
}

/**
 * Subscribe to permission denied events.
 */
export function onPermissionDenied(fn: (type: XRPermissionType) => void): () => void {
  EVENT_LISTENERS.get('permissionDenied')!.add(fn);
  return () => EVENT_LISTENERS.get('permissionDenied')!.delete(fn);
}
