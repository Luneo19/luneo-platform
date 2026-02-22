import { Test, TestingModule } from '@nestjs/testing';
import { QrGeneratorService } from '../qr-codes/qr-generator.service';

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toBuffer: jest.fn().mockImplementation(() =>
      Promise.resolve(Buffer.from([0x89, 0x50, 0x4e, 0x0d, 0x0a])),
    ),
    toString: jest.fn().mockImplementation(() =>
      Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    ),
  },
}));

describe('QrGeneratorService', () => {
  let service: QrGeneratorService;

  beforeEach(async () => {
    const qrcodeMock = (jest.requireMock('qrcode') as { default: { toBuffer: jest.Mock; toString: jest.Mock } })
      .default;
    qrcodeMock.toBuffer.mockImplementation(() =>
      Promise.resolve(Buffer.from([0x89, 0x50, 0x4e, 0x0d, 0x0a])),
    );
    qrcodeMock.toString.mockImplementation(() =>
      Promise.resolve('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [QrGeneratorService],
    }).compile();
    service = module.get<QrGeneratorService>(QrGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate PNG QR code', async () => {
    const buffer = await service.generateQR('https://example.com/ar/view/1', { format: 'png' });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
  });

  it('should generate SVG QR code', async () => {
    const buffer = await service.generateQR('https://example.com/ar/view/1', { format: 'svg' });
    expect(Buffer.isBuffer(buffer)).toBe(true);
    const str = buffer.toString('utf-8');
    expect(str).toContain('<svg');
    expect(str).toContain('</svg>');
  });

  it('should respect size options', async () => {
    const small = await service.generateQR('https://a.co', { size: 100, format: 'png' });
    const large = await service.generateQR('https://a.co', { size: 500, format: 'png' });
    expect(Buffer.isBuffer(small)).toBe(true);
    expect(Buffer.isBuffer(large)).toBe(true);
    expect(small.length).toBeGreaterThan(0);
    expect(large.length).toBeGreaterThan(0);
  });

  it('should respect error correction level', async () => {
    const withH = await service.generateQR('data', { errorCorrectionLevel: 'H', format: 'png', size: 200 });
    const withL = await service.generateQR('data', { errorCorrectionLevel: 'L', format: 'png', size: 200 });
    expect(Buffer.isBuffer(withH)).toBe(true);
    expect(Buffer.isBuffer(withL)).toBe(true);
  });

  it('should encode URLs correctly', async () => {
    const url = 'https://app.luneo.io/ar/preview/model-123?platform=ios';
    const buffer = await service.generatePNG(url);
    expect(buffer.length).toBeGreaterThan(0);
    const pngAgain = await service.generateQR(url, { format: 'png', size: 300 });
    expect(pngAgain.length).toBe(buffer.length);
  });

  it('should generate via generatePNG helper', async () => {
    const buffer = await service.generatePNG('https://test.com', 400, 'Q');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate via generateSVG helper', async () => {
    const buffer = await service.generateSVG('https://test.com', 350, 'H');
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString('utf-8')).toMatch(/<svg[\s\S]*<\/svg>|<svg[^>]*\/>/);
  });
});
