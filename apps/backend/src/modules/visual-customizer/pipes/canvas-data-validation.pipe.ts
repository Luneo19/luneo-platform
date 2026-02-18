import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import {
  VISUAL_CUSTOMIZER_LIMITS,
  CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES,
  CUSTOMIZER_ALLOWED_DOMAINS,
} from '../visual-customizer.constants';

type CanvasObject = {
  type: string;
  src?: string;
  objects?: CanvasObject[];
  [key: string]: unknown;
};

type CanvasData = {
  version?: string;
  objects: CanvasObject[];
  [key: string]: unknown;
};

@Injectable()
export class CanvasDataValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): CanvasData {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Canvas data must be an object');
    }

    const canvasData = value as CanvasData;

    // Validate structure
    if (!canvasData.objects || !Array.isArray(canvasData.objects)) {
      throw new BadRequestException('Canvas data must have an objects array');
    }

    // Validate object count
    const objectCount = this.countObjects(canvasData.objects);
    if (objectCount > VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY) {
      throw new BadRequestException(
        `Canvas contains too many objects. Maximum: ${VISUAL_CUSTOMIZER_LIMITS.MAX_DESIGN_COMPLEXITY}`,
      );
    }

    // Validate JSON size
    const jsonString = JSON.stringify(canvasData);
    const jsonSizeBytes = Buffer.byteLength(jsonString, 'utf8');
    if (jsonSizeBytes > VISUAL_CUSTOMIZER_LIMITS.MAX_CANVAS_DATA_SIZE_BYTES) {
      throw new BadRequestException(
        `Canvas data size exceeds maximum allowed size of ${VISUAL_CUSTOMIZER_LIMITS.MAX_CANVAS_DATA_SIZE_BYTES} bytes`,
      );
    }

    // Validate each object recursively
    this.validateObjects(canvasData.objects);

    return canvasData;
  }

  private countObjects(objects: CanvasObject[]): number {
    let count = objects.length;
    for (const obj of objects) {
      if (obj.objects && Array.isArray(obj.objects)) {
        count += this.countObjects(obj.objects);
      }
    }
    return count;
  }

  private validateObjects(objects: CanvasObject[]): void {
    for (const obj of objects) {
      // Validate object type
      if (!obj.type || typeof obj.type !== 'string') {
        throw new BadRequestException('Canvas object must have a type');
      }

      if (!CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES.includes(obj.type as typeof CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES[number])) {
        throw new BadRequestException(
          `Invalid object type: ${obj.type}. Allowed types: ${CUSTOMIZER_CANVAS_ALLOWED_OBJECT_TYPES.join(', ')}`,
        );
      }

      // Validate image objects
      if (obj.type === 'image' && obj.src) {
        this.validateImageSrc(obj.src as string);
      }

      // Recursively validate groups
      if (obj.type === 'group' && obj.objects && Array.isArray(obj.objects)) {
        this.validateObjects(obj.objects);
      }
    }
  }

  private validateImageSrc(src: string): void {
    if (typeof src !== 'string') {
      throw new BadRequestException('Image src must be a string');
    }

    // Allow data URLs
    if (src.startsWith('data:image/')) {
      return;
    }

    // Validate HTTPS URLs
    if (!src.startsWith('https://')) {
      throw new BadRequestException('Image src must be https:// or data:image/');
    }

    // Validate domain
    try {
      const url = new URL(src);
      const hostname = url.hostname;

      const isAllowed = CUSTOMIZER_ALLOWED_DOMAINS.some((domain) => {
        // Exact match
        if (hostname === domain) {
          return true;
        }
        // Subdomain match
        if (hostname.endsWith(`.${domain}`)) {
          return true;
        }
        return false;
      });

      if (!isAllowed) {
        throw new BadRequestException(
          `Image src domain not allowed. Allowed domains: ${CUSTOMIZER_ALLOWED_DOMAINS.join(', ')}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid image src URL format');
    }
  }
}
