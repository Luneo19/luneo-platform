/**
 * CanvasDataValidationPipe unit tests
 */
import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common';
import { CanvasDataValidationPipe } from './canvas-data-validation.pipe';
import { VISUAL_CUSTOMIZER_LIMITS } from '../visual-customizer.constants';

describe('CanvasDataValidationPipe', () => {
  let pipe: CanvasDataValidationPipe;
  const metadata: ArgumentMetadata = {
    type: 'body',
    data: '',
  };

  beforeEach(() => {
    pipe = new CanvasDataValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    it('should accept valid canvas data', () => {
      const validData = {
        version: '1.0',
        objects: [
          {
            type: 'text',
            text: 'Hello',
            x: 10,
            y: 20,
          },
          {
            type: 'image',
            src: 'https://cloudinary.com/image.jpg',
            x: 50,
            y: 50,
          },
        ],
      };

      const result = pipe.transform(validData, metadata);

      expect(result).toEqual(validData);
    });

    it('should reject non-object input', () => {
      expect(() => pipe.transform(null, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform('string', metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(123, metadata)).toThrow(BadRequestException);
    });

    it('should reject data without objects array', () => {
      const invalidData = {
        version: '1.0',
      };

      expect(() => pipe.transform(invalidData, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(invalidData, metadata)).toThrow(
        /must have an objects array/,
      );
    });

    it('should reject too many objects', () => {
      const tooManyObjects = {
        objects: Array(200).fill({
          type: 'text',
          text: 'hello',
        }),
      };

      expect(() => pipe.transform(tooManyObjects, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(tooManyObjects, metadata)).toThrow(
        /too many objects/,
      );
    });

    it('should reject oversized data', () => {
      const largeData = {
        objects: Array(5).fill({
          type: 'text',
          text: 'x'.repeat(2 * 1024 * 1024),
        }),
      };

      expect(() => pipe.transform(largeData, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(largeData, metadata)).toThrow(
        /exceeds maximum allowed size/,
      );
    });

    it('should reject invalid object types', () => {
      const invalidData = {
        objects: [
          {
            type: 'invalid-type',
            x: 10,
            y: 20,
          },
        ],
      };

      expect(() => pipe.transform(invalidData, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(invalidData, metadata)).toThrow(
        /Invalid object type/,
      );
    });

    it('should reject too many objects', () => {
      const tooManyObjects = {
        objects: Array(VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY + 1).fill(
          {
            type: 'text',
            text: 'test',
          },
        ),
      };

      expect(() => pipe.transform(tooManyObjects, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(tooManyObjects, metadata)).toThrow(
        /too many objects/,
      );
    });

    it('should validate image URLs', () => {
      const validImageData = {
        objects: [
          {
            type: 'image',
            src: 'https://cloudinary.com/image.jpg',
          },
        ],
      };

      const result = pipe.transform(validImageData, metadata);
      expect(result).toEqual(validImageData);
    });

    it('should accept data URLs for images', () => {
      const dataUrlData = {
        objects: [
          {
            type: 'image',
            src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        ],
      };

      const result = pipe.transform(dataUrlData, metadata);
      expect(result).toEqual(dataUrlData);
    });

    it('should reject HTTP (non-HTTPS) image URLs', () => {
      const httpImageData = {
        objects: [
          {
            type: 'image',
            src: 'http://example.com/image.jpg',
          },
        ],
      };

      expect(() => pipe.transform(httpImageData, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(httpImageData, metadata)).toThrow(
        /must be https/,
      );
    });

    it('should reject images from disallowed domains', () => {
      const disallowedDomainData = {
        objects: [
          {
            type: 'image',
            src: 'https://malicious.com/image.jpg',
          },
        ],
      };

      expect(() => pipe.transform(disallowedDomainData, metadata)).toThrow(
        BadRequestException,
      );
      expect(() => pipe.transform(disallowedDomainData, metadata)).toThrow(
        /domain not allowed/,
      );
    });

    it('should validate nested group objects', () => {
      const nestedData = {
        objects: [
          {
            type: 'group',
            objects: [
              {
                type: 'text',
                text: 'Nested',
              },
            ],
          },
        ],
      };

      const result = pipe.transform(nestedData, metadata);
      expect(result).toEqual(nestedData);
    });

    it('should count nested objects correctly', () => {
      const nestedData = {
        objects: [
          {
            type: 'group',
            objects: Array(50).fill({
              type: 'text',
              text: 'test',
            }),
          },
        ],
      };

      // Should pass (1 group + 50 nested = 51 total, under limit)
      const result = pipe.transform(nestedData, metadata);
      expect(result).toEqual(nestedData);
    });
  });
});
