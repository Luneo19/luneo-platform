import { DeviceCompatibility } from '../DeviceCompatibility';

// Mock logger
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('DeviceCompatibility', () => {
  describe('isIOS', () => {
    it('should detect iOS from user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      expect(DeviceCompatibility.isIOS()).toBe(true);
    });

    it('should detect iPad with touch points', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });
      expect(DeviceCompatibility.isIOS()).toBe(true);
    });
  });

  describe('isAndroid', () => {
    it('should detect Android from user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
        configurable: true,
      });
      expect(DeviceCompatibility.isAndroid()).toBe(true);
    });
  });

  describe('getDeviceType', () => {
    it('should return mobile for phone user agents', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
        configurable: true,
      });
      expect(DeviceCompatibility.getDeviceType()).toBe('mobile');
    });

    it('should return desktop for desktop user agents', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        configurable: true,
      });
      expect(DeviceCompatibility.getDeviceType()).toBe('desktop');
    });
  });

  describe('getBrowserInfo', () => {
    it('should extract Chrome version', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0) Chrome/121.0.0.0',
        configurable: true,
      });
      expect(DeviceCompatibility.getBrowserInfo()).toBe('Chrome 121');
    });
  });

  describe('checkWASM', () => {
    it('should return true when WASM is available', () => {
      expect(DeviceCompatibility.checkWASM()).toBe(true);
    });
  });
});
