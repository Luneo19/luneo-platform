import { renderHook, act } from '@testing-library/react';
import { useTryOn } from '../useTryOn';
import { endpoints } from '@/lib/api/client';
import { DeviceCompatibility } from '@/lib/virtual-tryon/DeviceCompatibility';

// Mock dependencies
jest.mock('@/lib/api/client', () => ({
  endpoints: {
    tryOn: {
      createSession: jest.fn(),
      endSession: jest.fn(),
      batchUploadScreenshots: jest.fn(),
      submitPerformance: jest.fn(),
    },
  },
}));

jest.mock('@/lib/virtual-tryon/DeviceCompatibility', () => ({
  DeviceCompatibility: {
    getDeviceType: jest.fn(() => 'desktop'),
    getGPUInfo: jest.fn(() => 'NVIDIA RTX 3080'),
    getBrowserInfo: jest.fn(() => 'Chrome 121'),
    check: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useTryOn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      (endpoints.tryOn.createSession as jest.Mock).mockResolvedValue({
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
      expect(endpoints.tryOn.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          configurationId: 'config-1',
        }),
      );
    });

    it('should handle errors during session start', async () => {
      (endpoints.tryOn.createSession as jest.Mock).mockRejectedValue(
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
      (endpoints.tryOn.createSession as jest.Mock).mockResolvedValue({
        data: { sessionId: 'session-123' },
      });
      (endpoints.tryOn.batchUploadScreenshots as jest.Mock).mockResolvedValue({});
      (endpoints.tryOn.submitPerformance as jest.Mock).mockResolvedValue({});
      (endpoints.tryOn.endSession as jest.Mock).mockResolvedValue({});

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

      expect(endpoints.tryOn.batchUploadScreenshots).toHaveBeenCalledWith(
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
      expect(endpoints.tryOn.submitPerformance).toHaveBeenCalled();
      expect(endpoints.tryOn.endSession).toHaveBeenCalledWith(
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

      expect(endpoints.tryOn.endSession).not.toHaveBeenCalled();
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

      (DeviceCompatibility.check as jest.Mock).mockResolvedValue(mockReport);

      const { result } = renderHook(() => useTryOn());

      await act(async () => {
        const report = await result.current.checkCompatibility();
        expect(report.isCompatible).toBe(true);
      });

      expect(result.current.compatibility).toEqual(mockReport);
    });
  });
});
