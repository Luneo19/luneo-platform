import { Test, TestingModule } from '@nestjs/testing';
import { CADValidationService } from './cad-validation.service';
import { CADValidationRequest } from './cad-constraints.interface';

describe('CADValidationService', () => {
  let service: CADValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CADValidationService],
    }).compile();

    service = module.get<CADValidationService>(CADValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should validate a design with valid thickness', async () => {
      const request: CADValidationRequest = {
        designId: 'design-123',
        productId: 'product-456',
        parameters: {
          ringSize: 7,
          metal: 'gold',
          thickness: 1.5,
        },
        constraints: {
          geometric: {
            minThickness: 0.8,
            maxThickness: 5.0,
          },
        },
      };

      const result = await service.validate(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a design with thickness below minimum', async () => {
      const request: CADValidationRequest = {
        designId: 'design-123',
        productId: 'product-456',
        parameters: {
          thickness: 0.5, // Below minimum
        },
        constraints: {
          geometric: {
            minThickness: 0.8,
          },
        },
      };

      const result = await service.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('thickness');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should detect stone collisions', async () => {
      const request: CADValidationRequest = {
        designId: 'design-123',
        productId: 'product-456',
        parameters: {
          stones: [
            {
              type: 'diamond',
              size: 5,
              position: { x: 0, y: 0, z: 0 },
            },
            {
              type: 'diamond',
              size: 5,
              position: { x: 0.1, y: 0, z: 0 }, // Too close
            },
          ],
        },
        constraints: {
          collision: {
            checkStoneStoneCollision: true,
            minClearance: 0.1,
          },
        },
      };

      const result = await service.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.type === 'collision')).toBe(true);
    });

    it('should estimate weight correctly', async () => {
      const request: CADValidationRequest = {
        designId: 'design-123',
        productId: 'product-456',
        parameters: {
          ringSize: 7,
          metal: 'gold',
          thickness: 1.5,
        },
        constraints: {},
      };

      const result = await service.validate(request);

      expect(result.estimatedWeight).toBeGreaterThan(0);
      expect(result.estimatedCost).toBeGreaterThan(0);
    });

    it('should assess manufacturing feasibility', async () => {
      const request: CADValidationRequest = {
        designId: 'design-123',
        productId: 'product-456',
        parameters: {
          ringSize: 7,
          metal: 'gold',
          thickness: 1.5,
          stones: [
            {
              type: 'diamond',
              size: 3,
              position: { x: 0, y: 0, z: 0 },
            },
          ],
        },
        constraints: {},
      };

      const result = await service.validate(request);

      expect(result.manufacturingFeasibility).toBeDefined();
      expect(result.manufacturingFeasibility?.feasible).toBe(true);
      expect(result.manufacturingFeasibility?.complexity).toBeDefined();
    });
  });
});
































