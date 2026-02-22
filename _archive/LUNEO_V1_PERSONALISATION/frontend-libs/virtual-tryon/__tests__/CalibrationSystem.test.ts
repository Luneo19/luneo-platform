import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalibrationSystem } from '../CalibrationSystem';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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

const mockGL = {
  getParameter: vi.fn(() => 'TestRenderer'),
  RENDERER: 0x1f01,
};

const origCreateElement = document.createElement.bind(document);
let createElementSpy: ReturnType<typeof vi.spyOn>;

describe('CalibrationSystem', () => {
  let calibration: CalibrationSystem;

  beforeEach(() => {
    createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'canvas') {
        const canvasEl = el as HTMLCanvasElement;
    canvasEl.getContext = vi.fn(() => mockGL) as unknown as typeof canvasEl.getContext;
      }
      return el;
    });
    localStorageMock.clear();
    calibration = new CalibrationSystem();
  });

  afterEach(() => {
    createElementSpy?.mockRestore();
  });

  it('should start with zero samples', () => {
    expect(calibration.getSampleCount()).toBe(0);
  });

  it('should track sample count as samples are added', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    expect(calibration.getSampleCount()).toBe(1);

    calibration.addSample({ handSizeNormalized: 0.13 });
    expect(calibration.getSampleCount()).toBe(2);
  });

  it('should return null when completing with fewer than 3 samples', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.13 });
    const result = calibration.complete();
    expect(result).toBeNull();
  });

  it('should complete successfully with 3+ hand samples', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    const result = calibration.complete();

    expect(result).not.toBeNull();
    expect(result?.pixelToRealRatio).toBeGreaterThan(0);
    expect(result?.accuracyScore).toBeGreaterThan(0);
    expect(result?.handSizeNormalized).toBeDefined();
    expect(result?.deviceFingerprint).toMatch(/^fp_/);
  });

  it('should complete with face samples when no hand data', () => {
    calibration.addSample({ faceWidthNormalized: 0.15 });
    calibration.addSample({ faceWidthNormalized: 0.15 });
    calibration.addSample({ faceWidthNormalized: 0.15 });
    const result = calibration.complete();

    expect(result).not.toBeNull();
    expect(result?.faceWidthNormalized).toBeDefined();
    expect(result?.handSizeNormalized).toBeUndefined();
  });

  it('should have high accuracy with consistent samples', () => {
    // All identical samples → zero variance → accuracy close to 1.0
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    const result = calibration.complete();

    expect(result?.accuracyScore).toBeCloseTo(1.0);
  });

  it('should have lower accuracy with high variance', () => {
    calibration.addSample({ handSizeNormalized: 0.05 });
    calibration.addSample({ handSizeNormalized: 0.15 });
    calibration.addSample({ handSizeNormalized: 0.25 });
    const result = calibration.complete();

    expect(result?.accuracyScore).toBeLessThan(1.0);
  });

  it('should reset properly', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.reset();
    expect(calibration.getSampleCount()).toBe(0);
  });

  it('should save calibration to localStorage after completion', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.complete();

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'luneo_tryon_calibration',
      expect.any(String),
    );
  });

  it('should retrieve saved calibration via static method', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.complete();

    const saved = CalibrationSystem.getSavedCalibration();
    expect(saved).not.toBeNull();
    expect(saved?.pixelToRealRatio).toBeGreaterThan(0);
  });

  it('should indicate calibration is needed when none saved', () => {
    expect(CalibrationSystem.needsCalibration()).toBe(true);
  });

  it('should indicate calibration is not needed after high accuracy calibration', () => {
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.addSample({ handSizeNormalized: 0.12 });
    calibration.complete();

    expect(CalibrationSystem.needsCalibration()).toBe(false);
  });
});
