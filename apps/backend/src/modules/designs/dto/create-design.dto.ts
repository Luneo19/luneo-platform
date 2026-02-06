import { IsString, IsOptional, IsObject, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignDto {
  @ApiProperty({ 
    description: 'Product ID to create design for',
    example: 'prod_123',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ 
    description: 'AI prompt for generating the design',
    example: 'Collier minimaliste or 18k',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  prompt: string;

  @ApiPropertyOptional({ 
    description: 'Additional options for design generation',
    example: { material: 'gold', size: 'medium' },
  })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;
}
