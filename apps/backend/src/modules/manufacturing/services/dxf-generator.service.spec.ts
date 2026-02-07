/**
 * DxfGeneratorService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DxfGeneratorService } from './dxf-generator.service';

describe('DxfGeneratorService', () => {
  let service: DxfGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DxfGeneratorService],
    }).compile();

    service = module.get<DxfGeneratorService>(DxfGeneratorService);
  });

  describe('generate', () => {
    it('should return a Buffer', async () => {
      const snapshot = {};
      const result = await service.generate(snapshot);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include DXF HEADER section', async () => {
      const snapshot = {};
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('SECTION');
      expect(str).toContain('HEADER');
      expect(str).toContain('$ACADVER');
      expect(str).toContain('ENDSEC');
    });

    it('should include ENTITIES section', async () => {
      const snapshot = {};
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('ENTITIES');
      expect(str).toContain('EOF');
    });

    it('should use default dimensions when not provided', async () => {
      const snapshot = {};
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('$EXTMAX');
      expect(str).toContain('800');
      expect(str).toContain('600');
    });

    it('should use specData width and height when provided', async () => {
      const snapshot = {
        specData: {
          width: 1000,
          height: 500,
          zones: [],
        },
      };
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('1000');
      expect(str).toContain('500');
    });

    it('should output LINE entities for zones', async () => {
      const snapshot = {
        specData: {
          width: 400,
          height: 300,
          zones: [
            {
              x: 10,
              y: 20,
              width: 100,
              height: 50,
              type: 'text',
              content: 'Hello',
              fontSize: 24,
            },
          ],
        },
      };
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('LINE');
      expect(str).toContain('10');
      expect(str).toContain('20');
      expect(str).toContain('TEXT');
      expect(str).toContain('Hello');
    });

    it('should escape percent in text content', async () => {
      const snapshot = {
        specData: {
          zones: [
            {
              x: 0,
              y: 0,
              width: 100,
              height: 50,
              content: '50% off',
            },
          ],
        },
      };
      const result = await service.generate(snapshot);
      const str = result.toString('utf-8');

      expect(str).toContain('50%% off');
    });

    it('should handle empty zones', async () => {
      const snapshot = { specData: { zones: [], width: 200, height: 200 } };
      const result = await service.generate(snapshot);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
