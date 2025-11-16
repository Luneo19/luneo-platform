type XRSystem = {
  isSessionSupported?: (mode: string) => Promise<boolean>;
};

export type ARCapability = {
  supported: boolean;
  reason?: string;
};

let cachedCapability: ARCapability | null = null;
const sessionStorageKey = 'luneo-ar-capability';
const XR_TIMEOUT_MS = 1500;

const getCachedCapability = (): ARCapability | null => {
  if (cachedCapability) return cachedCapability;
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(sessionStorageKey);
  if (stored) {
    try {
      cachedCapability = JSON.parse(stored) as ARCapability;
      return cachedCapability;
    } catch {
      sessionStorage.removeItem(sessionStorageKey);
    }
  }
  return null;
};

const persistCapability = (capability: ARCapability) => {
  cachedCapability = capability;
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(sessionStorageKey, JSON.stringify(capability));
};

const detectXRAsync = async (xrNavigator: Navigator & { xr?: XRSystem }) => {
  if (!xrNavigator.xr?.isSessionSupported) {
    return { supported: false, reason: 'XR indisponible' };
  }
  const result = await Promise.race([
    xrNavigator.xr.isSessionSupported('immersive-ar'),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), XR_TIMEOUT_MS)),
  ]);
  return result
    ? { supported: true }
    : { supported: false, reason: 'Session immersive AR non supportée' };
};

const detectAndroidSceneViewer = () => {
  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/i.test(userAgent);
  const hasSceneViewer = /GoogleVR|ArCore|SceneViewer/i.test(userAgent);
  if (isAndroid && hasSceneViewer) {
    return { supported: true, reason: 'Google Scene Viewer' };
  }
  return null;
};

export async function detectARCapability(): Promise<ARCapability> {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server environment' };
  }

  const cached = getCachedCapability();
  if (cached) {
    return cached;
  }

  const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
  if (isIOS && !('webkit' in window)) {
    const capability = { supported: false, reason: 'Safari requis pour AR Quick Look' };
    persistCapability(capability);
    return capability;
  }

  const sceneViewerCapability = detectAndroidSceneViewer();
  if (sceneViewerCapability) {
    persistCapability(sceneViewerCapability);
    return sceneViewerCapability;
  }

  const xrNavigator = navigator as Navigator & { xr?: XRSystem };
  if (xrNavigator.xr) {
    const xrCapability = await detectXRAsync(xrNavigator);
    persistCapability(xrCapability);
    return xrCapability;
  }

  const anchor = document.createElement('a');
  if (anchor.relList?.supports?.('ar')) {
    const capability = { supported: true };
    persistCapability(capability);
    return capability;
  }

  const capability = { supported: false, reason: 'Aucun runtime AR disponible' };
  persistCapability(capability);
  return capability;
}

