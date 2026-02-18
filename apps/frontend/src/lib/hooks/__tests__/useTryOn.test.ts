import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTryOn } from '../useTryOn';
import { DeviceCompatibility } from '@/lib/virtual-tryon/DeviceCompatibility';

const createSessionFn = vi.fn();
const endSessionFn = vi.fn();
const batchUploadScreenshotsFn = vi.fn();
const submitPerformanceFn = vi.fn();

vi.mock('@/lib/api/client', () => ({
  endpoints: {
    tryOn: {
      createSession: (...args: unknown[]) => createSessionFn(...args),
      endSession: (...args: unknown[]) => Promise.resolve(endSessionFn(...args)),
      batchUploadScreenshots: (...args: unknown[]) => batchUploadScreenshotsFn(...args),
      submitPerformance: (...args: unknown[]) => submitPerformanceFn(...args),
    },
  },
}));

vi.mock('@/lib/virtual-tryon/DeviceCompatibility', () => ({
  DeviceCompatibility: {
    getDeviceType: vi.fn(() => 'desktop'),
    getGPUInfo: vi.fn(() => 'NVIDIA RTX 3080'),
    getBrowserInfo: vi.fn(() => 'Chrome 121'),
    check: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@/lib/analytics', () => ({
  analytics: { track: vi.fn() },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useTryOn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useTryOn());

    expect(result.current.sessionId).toBeNull();
    expect(result.current.currentProductId).toBeNull();
    expect(result.current.screenshots).toEqual([]);
    expect(result.current.compatibility).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isTracking).toBe(false);
    expect(result.current.fps).toBe(0);
    expect(result.current.quality).toBe('high');
    expect(result.current.error).toBeNull();
  });

  describe('startSession', () => {
    it('should start a session and return session ID', async () => {
      createSessionFn.mockResolvedValue({
        data: { sessionId: 'session-123' },
      });

      const { result } = renderHook(() => useTryOn());

      let sessionId: string | null = null;
      await act(async () => {
        sessionId = await result.current.startSession('config-1', 'prod-1');
      });

      expect(sessionId).toBe('session-123');
      expect(result.current.sessionId).toBe('session-123');
      expect(result.current.currentProductId).toBe('prod-1');
      expect(result.current.isLoading).toBe(false);
      expect(createSessionFn).toHaveBeenCalledWith(
        expect.objectContaining({
          configurationId: 'config-1',
        }),
      );
    });

    it('should handle errors during session start', async () => {
      createSessionFn.mockRejectedValue(
        new Error('Network error'),
      );

      const { result } = renderHook(() => useTryOn());

      let sessionId: string | null = null;
      await act(async () => {
        sessionId = await result.current.startSession('config-1', 'prod-1');
      });

      expect(sessionId).toBeNull();
      expect(result.current.sessionId).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  describe('screenshots', () => {
    it('should capture and store screenshots', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.captureScreenshot('data:image/png;base64,abc', 'prod-1');
      });

      expect(result.current.screenshots).toHaveLength(1);
      expect(result.current.screenshots[0]).toEqual({
        dataUrl: 'data:image/png;base64,abc',
        productId: 'prod-1',
      });
    });

    it('should remove screenshots by index', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.captureScreenshot('data:img1', 'prod-1');
        result.current.captureScreenshot('data:img2', 'prod-2');
        result.current.captureScreenshot('data:img3', 'prod-3');
      });

      act(() => {
        result.current.removeScreenshot(1);
      });

      expect(result.current.screenshots).toHaveLength(2);
      expect(result.current.screenshots[0].dataUrl).toBe('data:img1');
      expect(result.current.screenshots[1].dataUrl).toBe('data:img3');
    });
  });

  describe('switchProduct', () => {
    it('should update current product ID', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.switchProduct('new-prod-1');
      });

      expect(result.current.currentProductId).toBe('new-prod-1');
    });
  });

  describe('quality and FPS', () => {
    it('should update FPS', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.setFps(45);
      });

      expect(result.current.fps).toBe(45);
    });

    it('should update quality', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.setQuality('low');
      });

      expect(result.current.quality).toBe('low');
    });
  });

  describe('tracking state', () => {
    it('should update tracking state', () => {
      const { result } = renderHook(() => useTryOn());

      act(() => {
        result.current.setIsTracking(true);
      });

      expect(result.current.isTracking).toBe(true);
    });
  });

  describe('endSession', () => {
    it('should upload screenshots and metrics, then end session', async () => {
      createSessionFn.mockResolvedValue({
        data: { sessionId: 'session-123' },
      });
      batchUploadScreenshotsFn.mockResolvedValue({});
      submitPerformanceFn.mockResolvedValue({});
      endSessionFn.mockResolvedValue({});

      const { result } = renderHook(() => useTryOn());

      // Start session
      await act(async () => {
        await result.current.startSession('config-1', 'prod-1');
      });

      // Capture screenshots
      act(() => {
        result.current.captureScreenshot('data:img1', 'prod-1');
      });

      // Record performance metric
      act(() => {
        result.current.recordPerformanceMetric({
          fps: 30,
          detectionLatencyMs: 20,
          renderLatencyMs: 10,
          deviceType: 'desktop',
        });
      });

      // End session
      await act(async () => {
        await result.current.endSession('purchased');
      });

      expect(batchUploadScreenshotsFn).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          screenshots: expect.arrayContaining([
            expect.objectContaining({
              imageBase64: 'data:img1',
              productId: 'prod-1',
            }),
          ]),
        }),
      );
      expect(submitPerformanceFn).toHaveBeenCalled();
      expect(endSessionFn).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          conversionAction: 'purchased',
        }),
      );

      // State should be cleared
      expect(result.current.sessionId).toBeNull();
      expect(result.current.currentProductId).toBeNull();
      expect(result.current.screenshots).toEqual([]);
    });

    it('should do nothing when no session is active', async () => {
      const { result } = renderHook(() => useTryOn());

      await act(async () => {
        await result.current.endSession();
      });

      expect(endSessionFn).not.toHaveBeenCalled();
    });
  });

  describe('checkCompatibility', () => {
    it('should check and store compatibility report', async () => {
      const mockReport = {
        isCompatible: true,
        webgl2: true,
        camera: true,
        gpuCapable: true,
        isIOS: false,
        isAndroid: false,
        isMobile: false,
        gpuRenderer: 'NVIDIA RTX 3080',
        maxTextureSize: 16384,
        recommendedMode: 'full_3d' as const,
        warnings: [],
        features: {
          webxr: false,
          webgl2: true,
          camera: true,
          wasm: true,
          sharedArrayBuffer: true,
          offscreenCanvas: true,
        },
      };

      vi.mocked(DeviceCompatibility.check).mockResolvedValue(mockReport);

      const { result } = renderHook(() => useTryOn());

      await act(async () => {
        const report = await result.current.checkCompatibility();
        expect(report.isCompatible).toBe(true);
      });

      expect(result.current.compatibility).toEqual(mockReport);
    });
  });
});
