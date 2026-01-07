import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Zone inputs (zoneId -> input)' })
  @IsObject()
  @IsNotEmpty()
  zoneInputs: Record<string, any>;

  @ApiProperty({ description: 'Spec version', required: false, default: '1.0.0' })
  @IsString()
  @IsOptional()
  specVersion?: string;

  @ApiProperty({ description: 'Metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}










