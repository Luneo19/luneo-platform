import { logger } from '@/lib/logger';

export interface CompatibilityReport {
  isCompatible: boolean;
  webgl2: boolean;
  camera: boolean;
  gpuCapable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  gpuRenderer: string | null;
  maxTextureSize: number;
  recommendedMode: 'full_3d' | '3d_low' | '2d_fallback' | 'ar_quicklook';
  warnings: string[];
  features: {
    webxr: boolean;
    webgl2: boolean;
    camera: boolean;
    wasm: boolean;
    sharedArrayBuffer: boolean;
    offscreenCanvas: boolean;
  };
}

/**
 * DeviceCompatibility - Detect device capabilities for Virtual Try-On.
 *
 * Checks:
 * - WebGL 2.0 support
 * - Camera availability
 * - GPU capabilities (via WebGL extensions)
 * - Platform detection (iOS for AR Quick Look fallback)
 * - Feature support (WebXR, WASM, SharedArrayBuffer)
 */
export class DeviceCompatibility {
  /**
   * Run all compatibility checks and return a comprehensive report.
   */
  static async check(): Promise<CompatibilityReport> {
    const warnings: string[] = [];

    // Platform detection
    const isIOS = DeviceCompatibility.isIOS();
    const isAndroid = DeviceCompatibility.isAndroid();
    const isMobile = isIOS || isAndroid || DeviceCompatibility.isMobileDevice();

    // WebGL 2.0
    const webglInfo = DeviceCompatibility.checkWebGL();
    if (!webglInfo.supported) {
      warnings.push('WebGL 2.0 is not supported on this device');
    }

    // Camera
    const cameraAvailable = await DeviceCompatibility.checkCamera();
    if (!cameraAvailable) {
      warnings.push('No camera detected or camera access denied');
    }

    // GPU assessment
    const gpuCapable = webglInfo.maxTextureSize >= 4096 && webglInfo.supported;
    if (webglInfo.supported && webglInfo.maxTextureSize < 4096) {
      warnings.push('GPU has limited texture support, reduced quality recommended');
    }

    // Feature detection
    const features = {
      webxr: DeviceCompatibility.checkWebXR(),
      webgl2: webglInfo.supported,
      camera: cameraAvailable,
      wasm: DeviceCompatibility.checkWASM(),
      sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
      offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
    };

    // Determine recommended mode
    let recommendedMode: CompatibilityReport['recommendedMode'] = 'full_3d';

    if (!webglInfo.supported || !cameraAvailable) {
      recommendedMode = '2d_fallback';
    } else if (isIOS && features.webxr) {
      recommendedMode = 'ar_quicklook';
    } else if (!gpuCapable || (isMobile && webglInfo.maxTextureSize < 8192)) {
      recommendedMode = '3d_low';
    }

    const isCompatible = cameraAvailable && (webglInfo.supported || isIOS);

    const report: CompatibilityReport = {
      isCompatible,
      webgl2: webglInfo.supported,
      camera: cameraAvailable,
      gpuCapable,
      isIOS,
      isAndroid,
      isMobile,
      gpuRenderer: webglInfo.renderer,
      maxTextureSize: webglInfo.maxTextureSize,
      recommendedMode,
      warnings,
      features,
    };

    logger.info('Device compatibility check', {
      compatible: isCompatible,
      mode: recommendedMode,
      warnings: warnings.length,
    });

    return report;
  }

  // ========================================
  // Individual checks
  // ========================================

  static checkWebGL(): {
    supported: boolean;
    renderer: string | null;
    maxTextureSize: number;
  } {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        (canvas.getContext('webgl2') as WebGL2RenderingContext) ||
        (canvas.getContext('webgl') as WebGLRenderingContext);

      if (!gl) {
        return { supported: false, renderer: null, maxTextureSize: 0 };
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER);
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;

      // Check if it's WebGL 2
      const isWebGL2 = gl instanceof WebGL2RenderingContext;

      canvas.remove();

      return {
        supported: isWebGL2,
        renderer: renderer as string,
        maxTextureSize,
      };
    } catch {
      return { supported: false, renderer: null, maxTextureSize: 0 };
    }
  }

  static async checkCamera(): Promise<boolean> {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.enumerateDevices
      ) {
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  static checkWebXR(): boolean {
    return typeof navigator !== 'undefined' && 'xr' in navigator;
  }

  static checkWASM(): boolean {
    try {
      if (typeof WebAssembly !== 'object') return false;
      const module = new WebAssembly.Module(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
      );
      return module instanceof WebAssembly.Module;
    } catch {
      return false;
    }
  }

  static isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  static isAndroid(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }

  static isMobileDevice(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  }

  /**
   * Get GPU info string for performance reporting.
   */
  static getGPUInfo(): string | null {
    const info = DeviceCompatibility.checkWebGL();
    return info.renderer;
  }

  /**
   * Get device type classification.
   */
  static getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    if ('ontouchstart' in window && window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser info string for performance reporting.
   */
  static getBrowserInfo(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    const ua = navigator.userAgent;
    const match =
      ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/) ||
      ua.match(/(MSIE|Trident)\s?\/?\s?(\d+)/);
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    return 'unknown';
  }
}
