import { FPSOptimizer, QualityLevel } from '../FPSOptimizer';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('FPSOptimizer', () => {
  let optimizer: FPSOptimizer;
  let qualityChanges: QualityLevel[];

  beforeEach(() => {
    qualityChanges = [];
    optimizer = new FPSOptimizer({
      sampleWindow: 5,
      onQualityChange: (quality) => {
        qualityChanges.push(quality);
      },
    });
  });

  it('should start at high quality', () => {
    expect(optimizer.getQuality()).toBe('high');
  });

  it('should downgrade to medium when FPS drops below threshold', () => {
    // Record low FPS samples
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(20);
    }
    expect(optimizer.getQuality()).toBe('medium');
    expect(qualityChanges).toContain('medium');
  });

  it('should downgrade to low when FPS continues dropping', () => {
    // First drop to medium
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(20);
    }
    // Then drop to low
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(14);
    }
    expect(optimizer.getQuality()).toBe('low');
  });

  it('should reach 2d_fallback on very low FPS', () => {
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(20);
    }
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(14);
    }
    for (let i = 0; i < 5; i++) {
      optimizer.recordFps(8);
    }
    expect(optimizer.getQuality()).toBe('2d_fallback');
  });

  it('should not change quality when FPS is stable and good', () => {
    for (let i = 0; i < 10; i++) {
      optimizer.recordFps(35);
    }
    expect(optimizer.getQuality()).toBe('high');
    expect(qualityChanges.length).toBe(0);
  });

  it('should respect forceQuality', () => {
    optimizer.forceQuality('low');
    expect(optimizer.getQuality()).toBe('low');
    expect(qualityChanges).toContain('low');
  });

  it('should reset to high quality', () => {
    optimizer.forceQuality('low');
    optimizer.reset();
    expect(optimizer.getQuality()).toBe('high');
  });

  it('should calculate average FPS correctly', () => {
    optimizer.recordFps(30);
    optimizer.recordFps(40);
    optimizer.recordFps(50);
    expect(optimizer.getAverageFps()).toBe(40);
  });
});
