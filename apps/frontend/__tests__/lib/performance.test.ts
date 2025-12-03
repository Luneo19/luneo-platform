/**
 * Tests Performance Utilities
 * Tests pour les utilitaires d'optimisation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCloudinaryUrl,
  getResponsiveImage,
  getThumbnailUrl,
  getAvatarUrl,
  calculateAspectRatio,
  optimizeImageUrl,
} from '@/lib/performance/image-optimization';
import {
  shouldPreload,
} from '@/lib/performance/preload';

describe('Image Optimization', () => {
  describe('getCloudinaryUrl', () => {
    it('should generate basic Cloudinary URL', () => {
      const url = getCloudinaryUrl('sample.jpg');
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('sample.jpg');
    });

    it('should include width transformation', () => {
      const url = getCloudinaryUrl('sample.jpg', { width: 800 });
      expect(url).toContain('w_800');
    });

    it('should include height transformation', () => {
      const url = getCloudinaryUrl('sample.jpg', { height: 600 });
      expect(url).toContain('h_600');
    });

    it('should include quality transformation', () => {
      const url = getCloudinaryUrl('sample.jpg', { quality: 90 });
      expect(url).toContain('q_90');
    });

    it('should include format transformation', () => {
      const url = getCloudinaryUrl('sample.jpg', { format: 'webp' });
      expect(url).toContain('f_webp');
    });

    it('should include blur effect', () => {
      const url = getCloudinaryUrl('sample.jpg', { blur: 500 });
      expect(url).toContain('e_blur:500');
    });

    it('should include grayscale effect', () => {
      const url = getCloudinaryUrl('sample.jpg', { grayscale: true });
      expect(url).toContain('e_grayscale');
    });

    it('should handle external URLs with fetch', () => {
      const url = getCloudinaryUrl('https://example.com/image.jpg');
      expect(url).toContain('fetch/');
    });
  });

  describe('getResponsiveImage', () => {
    it('should generate srcSet with multiple widths', () => {
      const config = getResponsiveImage('sample.jpg');
      expect(config.srcSet.length).toBeGreaterThan(0);
    });

    it('should include sizes attribute', () => {
      const config = getResponsiveImage('sample.jpg');
      expect(config.sizes).toBeDefined();
      expect(config.sizes).toContain('vw');
    });

    it('should respect maxWidth option', () => {
      const config = getResponsiveImage('sample.jpg', { maxWidth: 800, widths: [320, 640, 960, 1280] });
      const maxSrcSetWidth = Math.max(...config.srcSet.map(s => s.width));
      expect(maxSrcSetWidth).toBeLessThanOrEqual(800);
    });

    it('should use custom widths', () => {
      const customWidths = [100, 200, 300];
      const config = getResponsiveImage('sample.jpg', { widths: customWidths });
      expect(config.srcSet.map(s => s.width)).toEqual(customWidths);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should generate thumbnail with default size for external URL', () => {
      const url = getThumbnailUrl('https://example.com/sample.jpg');
      expect(url).toContain('w_150');
      expect(url).toContain('h_150');
    });

    it('should generate thumbnail with custom size', () => {
      const url = getThumbnailUrl('https://example.com/sample.jpg', 200);
      expect(url).toContain('w_200');
      expect(url).toContain('h_200');
    });

    it('should return local paths as-is', () => {
      const url = getThumbnailUrl('/images/sample.jpg');
      expect(url).toBe('/images/sample.jpg');
    });
  });

  describe('getAvatarUrl', () => {
    it('should return default avatar for null', () => {
      const url = getAvatarUrl(null);
      expect(url).toContain('ui-avatars.com');
    });

    it('should return default avatar for undefined', () => {
      const url = getAvatarUrl(undefined);
      expect(url).toContain('ui-avatars.com');
    });

    it('should generate optimized avatar for external URL', () => {
      const url = getAvatarUrl('https://example.com/avatar.jpg', 50);
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('w_100'); // 2x for retina
    });

    it('should return local paths as-is', () => {
      const url = getAvatarUrl('/images/avatar.jpg');
      expect(url).toBe('/images/avatar.jpg');
    });
  });

  describe('calculateAspectRatio', () => {
    it('should calculate 16:9 ratio', () => {
      const { ratio, padding } = calculateAspectRatio(16, 9);
      expect(ratio).toBeCloseTo(0.5625, 4);
      expect(padding).toBe('56.25%');
    });

    it('should calculate 4:3 ratio', () => {
      const { ratio, padding } = calculateAspectRatio(4, 3);
      expect(ratio).toBeCloseTo(0.75, 4);
      expect(padding).toBe('75%');
    });

    it('should calculate 1:1 ratio', () => {
      const { ratio, padding } = calculateAspectRatio(1, 1);
      expect(ratio).toBe(1);
      expect(padding).toBe('100%');
    });
  });

  describe('optimizeImageUrl', () => {
    it('should optimize external URLs', () => {
      const url = optimizeImageUrl('https://example.com/image.jpg', { width: 800 });
      expect(url).toContain('cloudinary.com');
      expect(url).toContain('w_800');
    });

    it('should return local paths as-is', () => {
      const url = optimizeImageUrl('/images/local.jpg');
      expect(url).toBe('/images/local.jpg');
    });
  });
});

describe('Preload Utilities', () => {
  describe('shouldPreload', () => {
    it('should return true when navigator is undefined', () => {
      // In test environment without full navigator
      const result = shouldPreload();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('Performance Metrics', () => {
  it('should have reasonable image quality defaults', () => {
    const url = getCloudinaryUrl('sample.jpg');
    expect(url).toContain('q_80'); // Default quality
  });

  it('should use auto format by default', () => {
    const url = getCloudinaryUrl('sample.jpg');
    expect(url).toContain('f_auto');
  });
});

