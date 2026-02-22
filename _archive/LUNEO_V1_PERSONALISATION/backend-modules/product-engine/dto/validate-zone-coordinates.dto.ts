import { IsNumber, IsObject, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Zone is Partial<ProductZone> - validated as object for flexibility.
 * See product-rules.interface.ts for ProductZone shape.
 */
export class ValidateZoneCoordinatesDto {
  @ApiProperty({ description: 'Partial zone data to validate' })
  @IsObject()
  zone: Record<string, unknown>;

  @ApiProperty({ description: 'Canvas width in pixels', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  canvasWidth: number;

  @ApiProperty({ description: 'Canvas height in pixels', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  canvasHeight: number;
}
