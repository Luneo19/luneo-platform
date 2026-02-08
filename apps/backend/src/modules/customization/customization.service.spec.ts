/**
 * CustomizationService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { CustomizationService } from './customization.service';
import { ConfigService } from '@nestjs/config';

const mockFetch = jest.fn();

describe('CustomizationService', () => {
  let service: CustomizationService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'ai.engineUrl') return 'http://ai-engine:8000';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).fetch = mockFetch;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomizationService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CustomizationService>(CustomizationService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCustomization', () => {
    const validBody = {
      productId: 'prod-1',
      zoneId: 'zone-1',
      prompt: 'Hello',
      zoneUV: { u: [0, 1], v: [0, 1] },
      modelUrl: 'https://model.glb',
    };

    it('should call AI engine and return result', async () => {
      const aiResponse = { jobId: 'job-1', textureUrl: 'https://texture.png' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(aiResponse),
      });

      const result = await service.generateCustomization(validBody);

      expect(result).toEqual(aiResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/generate\/texture$/),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"text":"Hello"'),
        }),
      );
    });

    it('should send default font, color, size, effect when not provided', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

      await service.generateCustomization(validBody);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.font).toBe('Arial');
      expect(body.color).toBe('#000000');
      expect(body.size).toBe(24);
      expect(body.effect).toBe('engraved');
    });

    it('should throw InternalServerErrorException when AI engine returns error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      });

      await expect(service.generateCustomization(validBody)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.generateCustomization(validBody)).rejects.toThrow(/AI Engine error/);
    });

    it('should throw InternalServerErrorException on fetch failure', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.generateCustomization(validBody)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.generateCustomization(validBody)).rejects.toThrow(/Erreur lors de la génération/);
    });
  });
});
