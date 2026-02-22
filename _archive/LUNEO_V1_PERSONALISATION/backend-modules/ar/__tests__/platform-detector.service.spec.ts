import { Test, TestingModule } from '@nestjs/testing';
import { PlatformDetectorService } from '../platforms/platform-detector.service';

describe('PlatformDetectorService', () => {
  let service: PlatformDetectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformDetectorService],
    }).compile();
    service = module.get<PlatformDetectorService>(PlatformDetectorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should detect iOS Safari -> ar-quick-look + usdz', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const result = service.detect(ua);
    expect(result.platform).toBe('ios');
    expect(result.method).toBe('ar-quick-look');
    expect(result.format).toBe('usdz');
    expect(result.fallback).toBeNull();
  });

  it('should detect iOS Chrome -> ar-quick-look + usdz', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/119.0.6045.109 Mobile/15E148 Safari/604.1';
    const result = service.detect(ua);
    expect(result.platform).toBe('ios');
    expect(result.method).toBe('ar-quick-look');
    expect(result.format).toBe('usdz');
  });

  it('should detect Android Chrome -> scene-viewer + gltf', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36';
    const result = service.detect(ua);
    expect(result.platform).toBe('android');
    expect(result.method).toBe('scene-viewer');
    expect(result.format).toBe('gltf');
    expect(result.fallback).toBe('webxr');
  });

  it('should detect Android Firefox -> webxr + gltf', () => {
    const ua =
      'Mozilla/5.0 (Android 13; Mobile; rv:119.0) Gecko/119.0 Firefox/119.0';
    const result = service.detect(ua);
    expect(result.platform).toBe('android');
    expect(result.method).toBe('webxr');
    expect(result.format).toBe('gltf');
    expect(result.fallback).toBe('model-viewer');
  });

  it('should detect Desktop Chrome -> qr-redirect', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';
    const result = service.detect(ua);
    expect(result.platform).toBe('desktop');
    expect(result.method).toBe('qr-redirect');
    expect(result.format).toBe('glb');
  });

  it('should detect Desktop Safari -> qr-redirect', () => {
    const ua =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const result = service.detect(ua);
    expect(result.platform).toBe('desktop');
    expect(result.method).toBe('qr-redirect');
  });

  it('should detect Meta Quest -> webxr', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 10; Quest 2) AppleWebKit/537.36 (KHTML, like Gecko) OculusBrowser/15.0 Chrome/91.0.4472.120 Safari/537.36';
    const result = service.detect(ua);
    expect(result.method).toBe('webxr');
    expect(result.format).toBe('gltf');
    expect(result.fallback).toBe('model-viewer');
  });

  it('should return desktop for undefined User-Agent', () => {
    const result = service.detect(undefined);
    expect(result.platform).toBe('desktop');
    expect(result.method).toBe('qr-redirect');
  });

  it('should return features with planeDetection and hitTest', () => {
    const result = service.detect(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    expect(result.features.planeDetection).toBe(true);
    expect(result.features.hitTest).toBe(true);
  });
});
