import { IsString, IsOptional, IsObject, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignDto {
  @ApiProperty({ description: 'Name of the design' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the design' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'AI prompt for generating the design' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt: string;

  @ApiProperty({ description: 'Product ID to create design for' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Customization data for the design' })
  @IsObject()
  @IsOptional()
  customizationData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}


