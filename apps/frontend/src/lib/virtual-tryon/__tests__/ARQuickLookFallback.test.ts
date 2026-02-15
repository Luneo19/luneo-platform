import { ARQuickLookFallback } from '../ARQuickLookFallback';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe('ARQuickLookFallback', () => {
  describe('isAvailable', () => {
    it('should return ios=false, android=false on desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const result = ARQuickLookFallback.isAvailable();
      expect(result.ios).toBe(false);
      expect(result.android).toBe(false);
    });

    it('should return ios=true on iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'iPhone',
        configurable: true,
      });

      const result = ARQuickLookFallback.isAvailable();
      expect(result.ios).toBe(true);
    });

    it('should return android=true on Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux armv81',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });

      const result = ARQuickLookFallback.isAvailable();
      expect(result.android).toBe(true);
    });
  });

  describe('createARLink', () => {
    it('should create iOS AR Quick Look link with USDZ model', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'iPhone',
        configurable: true,
      });

      const link = ARQuickLookFallback.createARLink({
        modelUSDZUrl: 'https://cdn.example.com/model.usdz',
        modelGLBUrl: 'https://cdn.example.com/model.glb',
        productName: 'Gold Ring',
      });

      expect(link).not.toBeNull();
      expect(link?.href).toContain('.usdz');
      expect(link?.rel).toBe('ar');
    });

    it('should create Android Scene Viewer link with GLB model', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux armv81',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });

      const link = ARQuickLookFallback.createARLink({
        modelUSDZUrl: 'https://cdn.example.com/model.usdz',
        modelGLBUrl: 'https://cdn.example.com/model.glb',
        productName: 'Gold Ring',
      });

      expect(link).not.toBeNull();
      expect(link?.href).toContain('scene-viewer');
      expect(link?.href).toContain('model.glb');
    });

    it('should include call-to-action in iOS link when provided', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'iPhone',
        configurable: true,
      });

      const link = ARQuickLookFallback.createARLink({
        modelUSDZUrl: 'https://cdn.example.com/model.usdz',
        productName: 'Gold Ring',
        callToAction: 'Buy Now',
        callToActionUrl: 'https://shop.example.com/ring',
      });

      expect(link).not.toBeNull();
      expect(link?.href).toContain('callToAction');
    });

    it('should return null when no model URLs provided', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const link = ARQuickLookFallback.createARLink({
        productName: 'Gold Ring',
      });

      expect(link).toBeNull();
    });
  });

  describe('launch', () => {
    it('should return not supported on desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });

      const result = ARQuickLookFallback.launch({
        modelUSDZUrl: 'https://cdn.example.com/model.usdz',
        modelGLBUrl: 'https://cdn.example.com/model.glb',
      });

      expect(result.supported).toBe(false);
      expect(result.platform).toBe('none');
      expect(result.launched).toBe(false);
    });
  });
});
